import gradio as gr
import os
import shutil
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from upstash_vector import Index
from dotenv import load_dotenv
import requests
import zipfile
from io import BytesIO
import uuid
import pathlib
import numpy as np
from datetime import datetime

# --- Initial Setup & Debugging ---
print("Starting application: Visual Image Search Engine")
print("Loading environment variables...")
# Load environment variables from .env file
load_dotenv()

UPSTASH_URL = os.getenv("UPSTASH_URL")
UPSTASH_TOKEN = os.getenv("UPSTASH_TOKEN")

print(f"UPSTASH_URL: {'Loaded' if UPSTASH_URL else 'Not Found'}")
print(f"UPSTASH_TOKEN: {'Loaded' if UPSTASH_TOKEN else 'Not Found'}")

# Initialize Upstash Vector Index
if not UPSTASH_URL or not UPSTASH_TOKEN:
    error_msg = "Upstash credentials (UPSTASH_URL, UPSTASH_TOKEN) not found in .env file. Please check your .env configuration."
    print(f"ERROR: {error_msg}")
    raise ValueError(error_msg)

print("Connecting to Upstash Vector...")
try:
    index = Index(url=UPSTASH_URL, token=UPSTASH_TOKEN)
    index_info = index.info()
    print(f"Successfully connected to Upstash Vector. Index info: Vector count = {index_info.vector_count}, Pending count = {index_info.pending_vector_count}")
except Exception as e:
    error_msg = f"Failed to connect to Upstash Vector or retrieve index info: {e}"
    print(f"ERROR: {error_msg}")
    raise ConnectionError(error_msg)

# Initialize CLIP model and processor
MODEL_NAME = "openai/clip-vit-large-patch14"
print(f"Loading CLIP model: {MODEL_NAME}...")
try:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    clip_model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    clip_processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    print(f"CLIP model '{MODEL_NAME}' loaded successfully on {device}.")
except Exception as e:
    error_msg = f"Error loading CLIP model '{MODEL_NAME}': {e}"
    print(f"ERROR: {error_msg}")
    clip_model = None
    clip_processor = None

# --- Path Definitions using pathlib ---
SCRIPT_DIR = pathlib.Path(__file__).parent.resolve()
print(f"Script directory: {SCRIPT_DIR}")

LOCALGrocery_PATH_NAME = "GroceryStoreDataset"
LOCALGrocery_PATH = SCRIPT_DIR / LOCALGrocery_PATH_NAME
print(f"Base path for dataset: {LOCALGrocery_PATH}")

DATASET_FOLDER_NAME = "dataset"
DATASET_BASE_PATH = LOCALGrocery_PATH / DATASET_FOLDER_NAME
print(f"Dataset base path (content): {DATASET_BASE_PATH}")

ICONIC_IMAGES_SUBPATH = "iconic-images-and-descriptions"
IMAGE_FOLDER_PATH = DATASET_BASE_PATH / ICONIC_IMAGES_SUBPATH
print(f"Target image folder for population/browsing: {IMAGE_FOLDER_PATH}")

DOWNLOADS_DIR_NAME = "downloads"
DOWNLOADS_PATH = SCRIPT_DIR / DOWNLOADS_DIR_NAME
os.makedirs(DOWNLOADS_PATH, exist_ok=True)
print(f"Downloads directory: {DOWNLOADS_PATH}")

FETCH_FACTOR = 2 # Factor to multiply top_k by when querying Upstash
print(f"Using FETCH_FACTOR: {FETCH_FACTOR} for Upstash queries.")

# --- Dataset Download and Preparation ---
GROCERY_DATASET_GITHUB_URL = "https://github.com/marcusklasson/GroceryStoreDataset/archive/refs/heads/master.zip"

def download_and_extract_dataset():
    if DATASET_BASE_PATH.exists() and any(DATASET_BASE_PATH.iterdir()):
        print(f"Dataset found at: {DATASET_BASE_PATH}")
        return True

    print(f"Dataset not found or empty at {DATASET_BASE_PATH}. Attempting to download and extract...")
    print(f"Target local path for dataset: {LOCALGrocery_PATH}")
    
    LOCALGrocery_PATH.mkdir(parents=True, exist_ok=True)

    temp_zip_path = None
    temp_extract_dir = None

    try:
        temp_zip_path = LOCALGrocery_PATH / "temp_dataset.zip"
        temp_extract_dir = LOCALGrocery_PATH / "temp_extracted"

        print(f"Downloading from: {GROCERY_DATASET_GITHUB_URL}")
        response = requests.get(GROCERY_DATASET_GITHUB_URL, stream=True)
        response.raise_for_status()

        with open(temp_zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Download complete. Extracting...")

        if temp_extract_dir.exists():
            print(f"Removing existing temporary extraction directory: {temp_extract_dir}")
            shutil.rmtree(temp_extract_dir)
        temp_extract_dir.mkdir(parents=True, exist_ok=True)

        print(f"Extracting zip contents to temporary directory: {temp_extract_dir}")
        with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)
        
        print("Extraction complete. Organizing files...")
        print(f"Contents of temporary extraction directory ({temp_extract_dir}): {list(p.name for p in temp_extract_dir.iterdir())}")
        
        extracted_folders = list(temp_extract_dir.iterdir())
        if not extracted_folders:
            raise Exception("Extraction resulted in an empty temporary directory.")

        main_extracted_folder = extracted_folders[0]
        print(f"Identified main extracted folder: {main_extracted_folder.name}")
        source_dataset_folder = main_extracted_folder / DATASET_FOLDER_NAME
        print(f"Expected source dataset folder: {source_dataset_folder}")
        
        if not source_dataset_folder.exists() or not source_dataset_folder.is_dir():
            raise Exception(f"'{DATASET_FOLDER_NAME}' subfolder not found or is not a directory in extracted content: {main_extracted_folder.name}")

        if DATASET_BASE_PATH.exists():
            print(f"Removing existing (possibly incomplete) target folder: {DATASET_BASE_PATH}")
            shutil.rmtree(DATASET_BASE_PATH)
        
        print(f"Moving '{source_dataset_folder}' to '{DATASET_BASE_PATH}'...")
        shutil.move(str(source_dataset_folder), str(DATASET_BASE_PATH))
        print(f"Dataset successfully moved to: {DATASET_BASE_PATH}")
        
        print("Dataset setup complete.")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error downloading dataset: {e}")
        print("Please ensure the URL is correct and you have internet access.")
        print(f"Alternatively, manually download/extract the dataset to: {LOCALGrocery_PATH} so that '{DATASET_FOLDER_NAME}' is inside it.")
        return False
    except zipfile.BadZipFile:
        print("Error: Downloaded file is not a valid zip file or is corrupted.")
        return False
    except Exception as e:
        print(f"An unexpected error occurred during dataset download/extraction: {e}")
        print(f"Please manually ensure the dataset is at: {DATASET_BASE_PATH}")
        return False
    finally:
        if temp_zip_path and temp_zip_path.exists():
            print(f"Cleaning up temporary zip file: {temp_zip_path}")
            try:
                temp_zip_path.unlink()
            except Exception as e_clean_zip:
                print(f"Error cleaning up zip file {temp_zip_path}: {e_clean_zip}")
        
        if temp_extract_dir and temp_extract_dir.exists():
            print(f"Cleaning up temporary extraction directory: {temp_extract_dir}")
            try:
                shutil.rmtree(temp_extract_dir)
            except Exception as e_clean_dir:
                print(f"Error cleaning up extraction directory {temp_extract_dir}: {e_clean_dir}")

# Ensure dataset is available locally before proceeding
print("Ensuring local dataset is available...")
download_and_extract_dataset()
print("Local dataset check complete.")

# --- Embedding and Upstash Functions ---
def get_image_embedding(image_path_or_pil):
    if clip_model is None or clip_processor is None:
        print("CRITICAL: CLIP model not available for embedding.")
        return None
    try:
        image_input = None
        if isinstance(image_path_or_pil, (str, pathlib.Path)):
            if not os.path.exists(str(image_path_or_pil)):
                print(f"Warning: Image path does not exist: {image_path_or_pil}")
                return None
            image_input = Image.open(str(image_path_or_pil))
        elif isinstance(image_path_or_pil, Image.Image):
            image_input = image_path_or_pil
        else:
            print(f"Error: Invalid image input type: {type(image_path_or_pil)}")
            return None

        image = image_input.convert("RGB")
        
        inputs = clip_processor(images=image, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            embedding_tensor = clip_model.get_image_features(**inputs)
        
        embedding_np = embedding_tensor.cpu().numpy()
        normalized_embedding = embedding_np / np.linalg.norm(embedding_np, axis=1, keepdims=True)
        return normalized_embedding.flatten().tolist()
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path_or_pil}")
        return None
    except Exception as e:
        print(f"Error generating image embedding for '{str(image_path_or_pil)[:100]}...': {e}")
        return None

def get_text_embedding(text):
    if clip_model is None or clip_processor is None:
        print("CRITICAL: CLIP model not available for text embedding.")
        return None
    if not text or not isinstance(text, str):
        print("Error: Invalid text input for embedding.")
        return None
    try:
        inputs = clip_processor(text=[text.strip()], return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            embedding_tensor = clip_model.get_text_features(**inputs)

        embedding_np = embedding_tensor.cpu().numpy()
        normalized_embedding = embedding_np / np.linalg.norm(embedding_np, axis=1, keepdims=True)
        return normalized_embedding.flatten().tolist()
    except Exception as e:
        print(f"Error generating text embedding for '{text[:100]}...': {e}")
        return None

def resolve_image_path(path_from_db: str) -> str:
    if not path_from_db:
        print("Warning: resolve_image_path received an empty path string.")
        return ""

    normalized_path_str = path_from_db.replace("\\", "/")
    
    path_obj_direct = pathlib.Path(normalized_path_str)
    if path_obj_direct.is_absolute():
        if path_obj_direct.exists():
            print(f"Resolved as absolute path: {path_obj_direct}")
            return str(path_obj_direct)
        else:
            print(f"Info: Path '{path_obj_direct}' looks absolute but does not exist. Will try relative paths.")

    candidate_path_ds = (DATASET_BASE_PATH / normalized_path_str).resolve()
    if candidate_path_ds.exists():
        print(f"Resolved path relative to DATASET_BASE_PATH: {candidate_path_ds}")
        return str(candidate_path_ds)

    candidate_path_script = (SCRIPT_DIR / normalized_path_str).resolve()
    if candidate_path_script.exists():
        print(f"Resolved path relative to SCRIPT_DIR: {candidate_path_script}")
        return str(candidate_path_script)
    
    print(f"Warning: Could not resolve image path: '{path_from_db}' (normalized: '{normalized_path_str}').")
    print(f"  Tried relative to DATASET_BASE_PATH: {candidate_path_ds} (exists: {candidate_path_ds.exists()})")
    print(f"  Tried relative to SCRIPT_DIR: {candidate_path_script} (exists: {candidate_path_script.exists()})")
    return ""

def search_by_text(text_query: str, top_k: int):
    if not text_query:
        return ([], "Please enter a text query.", "", 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))

    if clip_model is None or clip_processor is None or index is None:
        return ([], "Error: Backend components not available.", text_query, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))
    
    query_embedding = get_text_embedding(text_query)
    if query_embedding is None:
        return ([], "Could not generate text embedding.", text_query, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))

    actual_query_k = top_k * FETCH_FACTOR
    print(f"Text search: Requested top_k={top_k}, querying Upstash for {actual_query_k} items.")
    try:
        results = index.query(vector=query_embedding, top_k=int(actual_query_k), include_metadata=True)
    except Exception as e:
        return ([], f"Error during Upstash search: {e}", text_query, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))

    gallery_items_data = []
    gallery_display_tuples = []
    resolved_paths_cache = {} 
    added_to_gallery_paths = set()

    if results:
        for res in results:
            if len(gallery_items_data) >= top_k:
                break 
            
            if res.metadata and "image_path" in res.metadata:
                raw_path_from_db = res.metadata["image_path"]
                
                abs_path_str = ""
                if raw_path_from_db in resolved_paths_cache:
                    abs_path_str = resolved_paths_cache[raw_path_from_db]
                else:
                    resolved_path = resolve_image_path(raw_path_from_db)
                    if resolved_path: 
                        abs_path_str = resolved_path
                    resolved_paths_cache[raw_path_from_db] = abs_path_str
                
                if abs_path_str and abs_path_str not in added_to_gallery_paths:
                    caption = f"Score: {res.score:.4f}"
                    gallery_items_data.append({"path": abs_path_str, "caption": caption, "score": res.score, "id": res.id, "metadata": res.metadata})
                    gallery_display_tuples.append((abs_path_str, caption))
                    added_to_gallery_paths.add(abs_path_str)
    
    valid_results_count = len(gallery_items_data)
    summary = f"Found {valid_results_count} unique images for query: '{text_query}' (Requested up to {top_k})."
    if not gallery_items_data:
        summary += " No relevant images found or paths were invalid."
    
    return (gallery_items_data, summary, text_query, 
            gr.update(value=gallery_display_tuples, visible=True, selected_index=None), 
            gr.update(visible=False), 
            gr.update(value="", visible=False), 
            None, 
            gr.update(value=True if gallery_items_data else False))

def search_by_image(image_query_input, top_k: int):
    if image_query_input is None:
        return ([], "Please upload an image for query.", None, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))

    if clip_model is None or clip_processor is None or index is None:
        return ([], "Error: Backend components not available.", None, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))

    query_image_pil = None
    if isinstance(image_query_input, Image.Image):
        query_image_pil = image_query_input.convert("RGB")
    elif isinstance(image_query_input, np.ndarray):
        try:
            query_image_pil = Image.fromarray(image_query_input.astype('uint8'), 'RGB')
        except Exception as e:
            return ([], "Error processing uploaded image.", None, 
                    gr.update(value=[], visible=True, selected_index=None), 
                    gr.update(visible=False), 
                    gr.update(value="", visible=False), 
                    None, 
                    gr.update(value=False))
    else:
        return ([], "Invalid query image format.", None, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))
        
    query_embedding = get_image_embedding(query_image_pil)
    if query_embedding is None:
        return ([], "Could not generate embedding for the uploaded image.", query_image_pil, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))

    actual_query_k = top_k * FETCH_FACTOR
    print(f"Image search: Requested top_k={top_k}, querying Upstash for {actual_query_k} items.")
    try:
        results = index.query(vector=query_embedding, top_k=int(actual_query_k), include_metadata=True)
    except Exception as e:
        return ([], f"Error during Upstash search: {e}", query_image_pil, 
                gr.update(value=[], visible=True, selected_index=None), 
                gr.update(visible=False), 
                gr.update(value="", visible=False), 
                None, 
                gr.update(value=False))
        
    gallery_items_data = []
    gallery_display_tuples = []
    resolved_paths_cache = {} 
    added_to_gallery_paths = set()

    if results:
        for res in results:
            if len(gallery_items_data) >= top_k:
                break

            if res.metadata and "image_path" in res.metadata:
                raw_path_from_db = res.metadata["image_path"]

                abs_path_str = ""
                if raw_path_from_db in resolved_paths_cache:
                    abs_path_str = resolved_paths_cache[raw_path_from_db]
                else:
                    resolved_path = resolve_image_path(raw_path_from_db)
                    if resolved_path: 
                        abs_path_str = resolved_path
                    resolved_paths_cache[raw_path_from_db] = abs_path_str

                if abs_path_str and abs_path_str not in added_to_gallery_paths:
                    caption = f"Score: {res.score:.4f}"
                    gallery_items_data.append({"path": abs_path_str, "caption": caption, "score": res.score, "id": res.id, "metadata": res.metadata})
                    gallery_display_tuples.append((abs_path_str, caption))
                    added_to_gallery_paths.add(abs_path_str)
    
    valid_results_count = len(gallery_items_data)
    summary = f"Found {valid_results_count} unique similar images (Requested up to {top_k})."
    if not gallery_items_data:
        summary += " No relevant images found or paths were invalid."
        
    return (gallery_items_data, summary, query_image_pil, 
            gr.update(value=gallery_display_tuples, visible=True, selected_index=None), 
            gr.update(visible=False), 
            gr.update(value="", visible=False), 
            None, 
            gr.update(value=True if gallery_items_data else False))

def handle_gallery_select(current_gallery_items: list, gallery_was_just_loaded: bool, evt: gr.SelectData):
    new_selected_path = None
    button_update = gr.update(visible=False)
    status_text = ""
    status_visible = False

    if evt.value is not None and evt.index is not None and current_gallery_items and evt.index < len(current_gallery_items):
        selected_item_data = current_gallery_items[evt.index]
        original_path_str = selected_item_data.get("path")
        if original_path_str and pathlib.Path(original_path_str).exists():
            new_selected_path = original_path_str
            if not gallery_was_just_loaded:
                button_update = gr.update(visible=True)
        else:
            new_selected_path = None
            if not gallery_was_just_loaded:
                status_text = "Error: Selected image path is invalid."
                status_visible = True
    
    status_update = gr.update(value=status_text, visible=status_visible)
    return new_selected_path, button_update, status_update, gr.update(value=False)

def perform_download(path_to_download_str: str):
    if not path_to_download_str:
        return gr.update(value="Error: No image selected for download.", visible=True)

    original_path = pathlib.Path(path_to_download_str)
    if not original_path.exists():
        return gr.update(value=f"Error: File not found at {original_path}", visible=True)

    target_filename = original_path.name
    os.makedirs(DOWNLOADS_PATH, exist_ok=True)
    copied_file_path = DOWNLOADS_PATH / target_filename
    
    try:
        shutil.copy(str(original_path), str(copied_file_path))
        print(f"Image '{target_filename}' copied to '{copied_file_path}'.")
        return gr.update(value=f"Downloaded '{target_filename}' to '{DOWNLOADS_PATH}'.", visible=True)
    except Exception as e:
        print(f"Error copying file for download: {e}")
        return gr.update(value=f"Error downloading file: {e}", visible=True)

# --- Gradio Interface Definition ---
with gr.Blocks(title="Visual Image Search", theme=gr.themes.Soft()) as iface:
    gr.Markdown("# Visual Image Search Engine using CLIP and Upstash")
    gr.Markdown("Use the left panel to search by text or image. Results will appear on the right.")

    gallery_items_state = gr.State([])
    selected_image_for_download_state = gr.State(None)
    gallery_just_loaded = gr.State(False)

    with gr.Row():
        with gr.Column(scale=1, min_width=300): 
            gr.Markdown("### Search Controls")
            with gr.Tabs() as search_type_tabs:
                with gr.TabItem("Text-to-Image Search"):
                    text_query_input = gr.Textbox(label="Enter Text Description", placeholder="e.g., 'red apple on a table'")
                    num_results_slider_text = gr.Slider(minimum=1, maximum=50, value=10, step=1, label="Number of Results")
                    search_button_text = gr.Button("Search by Text")
                    query_preview_text_display = gr.Textbox(label="Query Text Preview", interactive=False)
                
                with gr.TabItem("Image-to-Image Search"):
                    image_query_input = gr.Image(type="pil", label="Upload Query Image")
                    num_results_slider_image = gr.Slider(minimum=1, maximum=50, value=10, step=1, label="Number of Results")
                    search_button_image = gr.Button("Search by Image")
                    query_preview_image_display = gr.Image(label="Query Image Preview", interactive=False)
                    
        with gr.Column(scale=2, min_width=600): 
            gr.Markdown("### Search Results")
            results_summary_display = gr.Textbox(label="Search Summary", interactive=False)
            
            results_gallery = gr.Gallery(
                label="Results", 
                show_label=True, 
                elem_id="results_gallery", 
                columns=4, 
                object_fit="contain", 
                height="auto",    
                preview=False, 
                visible=True
            )
            
            download_action_button = gr.Button(value="Download", visible=False)
            download_status_text = gr.Textbox(label="Download Status", visible=False, interactive=False)

    search_button_text.click(
        fn=search_by_text,
        inputs=[text_query_input, num_results_slider_text],
        outputs=[ 
            gallery_items_state, 
            results_summary_display, 
            query_preview_text_display,
            results_gallery,
            download_action_button, 
            download_status_text,   
            selected_image_for_download_state,
            gallery_just_loaded
        ]
    )

    search_button_image.click(
        fn=search_by_image,
        inputs=[image_query_input, num_results_slider_image],
        outputs=[ 
            gallery_items_state, 
            results_summary_display, 
            query_preview_image_display,
            results_gallery,
            download_action_button, 
            download_status_text,   
            selected_image_for_download_state,
            gallery_just_loaded
        ]
    )

    results_gallery.select(
        fn=handle_gallery_select,
        inputs=[gallery_items_state, gallery_just_loaded],
        outputs=[selected_image_for_download_state, download_action_button, download_status_text, gallery_just_loaded],
        show_progress="hidden"
    )

    download_action_button.click(
        fn=perform_download,
        inputs=[selected_image_for_download_state],
        outputs=[download_status_text]
    )

if __name__ == '__main__':
    print("Ensuring local dataset is available...")
    if download_and_extract_dataset():
        print("Local dataset check complete.")
        if clip_model and clip_processor and index:
            print("All critical components seem ready. Launching Gradio interface...")
            iface.launch() 
        else:
            print("CRITICAL ERROR: Not all components (CLIP model/processor or Upstash Index) initialized. Cannot launch Gradio interface.")
    else:
        print("CRITICAL ERROR: Dataset not available. Cannot launch Gradio interface.")
