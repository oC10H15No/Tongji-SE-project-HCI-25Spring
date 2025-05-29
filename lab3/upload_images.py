import os
import csv
import torch
import numpy as np
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from upstash_vector import Index
from tqdm import tqdm

# ==== 配置区域 ====
UPSTASH_URL = "https://known-marmoset-57107-us1-vector.upstash.io"
UPSTASH_TOKEN = "ABgFMGtub3duLW1hcm1vc2V0LTU3MTA3LXVzMWFkbWluTWpKallUYzJaVEV0TUdZd055MDBZVGN6TFRreE5EQXRPRGRtTkRNNE1URTNPVGhq"
DATASET_ROOT = r"GroceryStoreDataset/dataset"  # 替换为你解压后的数据集根目录
LIMIT = None  # 可设为 100 测试，设为 None 处理所有数据
# ==================

# 初始化向量数据库连接
index = Index(url=UPSTASH_URL, token=UPSTASH_TOKEN)

# 加载 CLIP 模型
model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")
print("✅ CLIP 模型加载完成！")

def clean_path(p):
    return os.path.normpath(p.strip().replace('\ufeff', '').replace('\r', '').replace('\n', '').replace(' ', ''))

# 提取图像 embedding
def get_image_embedding(image_path):
    print(f"  ⤷ 尝试打开图像: {image_path}")
    image = Image.open(image_path).convert("RGB")
    print(f"  ⤷ 加载成功，开始预处理")
    inputs = processor(images=image, return_tensors="pt")
    print(f"  ⤷ 模型推理中...")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
    print(f"  ⤷ 推理完成")
    embedding = features[0].numpy()
    print(f"  ⤷ 提取完成")
    return embedding.astype(np.float32).tolist()

# 加载 fine_id → 名称/描述 映射
def load_label_info(classes_csv_path, dataset_root):
    label_map = {}
    with open(classes_csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                fine_id = int(row["Class ID (int)"])
                desc_rel_path = row["Product Description Path (str)"]
                desc_path = os.path.join(dataset_root, desc_rel_path.lstrip("/"))  # 去掉开头的斜杠
                with open(desc_path, encoding='utf-8') as df:
                    description = df.read().strip()
            except Exception as e:
                print(f"错误行: {row}, 错误: {e}")
                continue

            label_map[fine_id] = {
                "fine_label_name": row["Class Name (str)"],
                "coarse_label_name": row["Coarse Class Name (str)"],
                "coarse_label_id": int(row["Coarse Class ID (int)"]),
                "description": description
            }
    return label_map


# 遍历 txt 文件上传图像向量
def upload_dataset(txt_path, dataset_root, label_map, limit=None):
    with open(txt_path, 'r') as f:
        lines = f.readlines()

    if limit:
        lines = lines[:limit]

    for line in tqdm(lines, desc=f"Uploading from {os.path.basename(txt_path)}"):
        parts = line.strip().split(',')
        if len(parts) != 3:
            print(f"❌ 格式错误，跳过: {line}")
            continue

        rel_path = parts[0].strip()
        fine_id = int(parts[1].strip())
        coarse_id = int(parts[2].strip())

        rel_path = clean_path(parts[0].replace('/', os.sep))
        image_path = clean_path(os.path.join(dataset_root, rel_path))

        if not os.path.exists(image_path):
            print(f"⚠️ 图像不存在，跳过: {image_path}")
            print("原始路径内容:", repr(image_path))
            continue

        label_info = label_map.get(fine_id, {})
        metadata = {
            "fine_label_id": fine_id,
            "fine_label_name": label_info.get("fine_label_name", ""),
            "coarse_label_id": coarse_id,
            "coarse_label_name": label_info.get("coarse_label_name", ""),
            "description": label_info.get("description", ""),
            "image_path": rel_path,
            "image_type": "natural"
        }

        try:
            embedding = get_image_embedding(image_path)
            print("✅ 得到 embedding，准备上传:", rel_path)
            response = index.upsert(
                vectors=[(rel_path, embedding, metadata)]
            )
            print("✅ 上传成功:", response)
        except Exception as e:
            print(f"❌ 上传失败: {rel_path}, 错误: {e}")


# 主函数
if __name__ == "__main__":
    classes_csv_path = os.path.join(DATASET_ROOT, "classes.csv")
    label_map = load_label_info(classes_csv_path, DATASET_ROOT)

    for split_file in ["train.txt", "val.txt", "test.txt"]:
        txt_path = os.path.join(DATASET_ROOT, split_file)
        if os.path.exists(txt_path):
            print(f"✅ 开始处理 {split_file} 文件")
            upload_dataset(txt_path, DATASET_ROOT, label_map, limit=LIMIT)
        else:
            print(f"⚠️ 文件不存在，跳过: {txt_path}")

    print("✅ 所有图像上传完成！")
