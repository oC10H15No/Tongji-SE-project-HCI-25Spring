import os
import gradio as gr
from openai import OpenAI
import threading
from datetime import datetime

# 存储对话历史的全局变量
chat_histories = []
current_chat_index = -1

generation_status = {"should_stop": False}  

# 定义不同模型API客户端
def get_client(model_provider):
    if model_provider == "dashscope":
        return OpenAI(
            api_key="sk-263ca1c821b346af80e1d980d749f47e",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
    elif model_provider == "openrouter":
        return OpenAI(
            api_key="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",
            base_url="https://openrouter.ai/api/v1",
        )
    elif model_provider == "deepseek":
        return OpenAI(
            api_key="hCYuROnrEwQZlLK440E1B19dFa584fD2AdDf6a780d78C31c",
            base_url="https://llmapi.tongji.edu.cn/v1",
        )
    
    # 可添加更多模型API
    return None

# 定义可用模型列表
MODELS = [
    {"name": "qwen-max", "provider": "dashscope", "description": "Qwen AI model"},
    {"name": "DeepSeek-R1", "provider": "deepseek", "description": "DeepSeek AI model"},
    {"name": "moonshotai/kimi-vl-a3b-thinking:free", "provider": "openrouter", "description": "Kimi model"},
    # {"name": "google/gemini-2.5-pro-exp-03-25:free", "provider": "openrouter", "description": "Gemini 2.5 AI model"},
    {"name": "nvidia/llama-3.3-nemotron-super-49b-v1:free", "provider": "openrouter", "description": "Llama 3.3 AI model"},


]

def predict(message, history, model_info):
    """处理用户输入并生成回复"""
    model_name = model_info["name"]
    model_provider = model_info["provider"]

    generation_status["should_stop"] = False  # 重置生成状态
    
    # 获取对应的客户端
    client = get_client(model_provider)
    
    # 转换历史记录格式
    history_messages = []
    for h in history:
        history_messages.append({"role": "user", "content": h[0]})
        history_messages.append({"role": "assistant", "content": h[1]})
    
    # 构建消息列表
    messages = [
        {'role': 'system', 'content': 'You are a helpful assistant.'},
    ]
    messages.extend(history_messages)
    messages.append({'role': 'user', 'content': message})
    
    # 调用API获取回复
    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
        stream=True
    )
    
    # 流式输出回复
    partial_message = ""
    for chunk in response:
        if generation_status["should_stop"]:
            partial_message += "\n\n[Stopped by user]"
            yield partial_message
            return
        if chunk.choices[0].delta.content:
            partial_message += chunk.choices[0].delta.content
            yield partial_message

def create_new_chat():
    """创建新的聊天会话"""
    global current_chat_index
    current_chat_index = -1
    return [], gr.update(value="### New Chat")

def stop_generation():
    """停止生成"""
    generation_status["should_stop"] = True
    return None

def get_chat_titles():
    """获取所有聊天的标题列表，用于下拉选择"""
    global chat_histories
    
    choices = []
    for i, chat in enumerate(chat_histories):
        title = chat['title']
        time = chat['time']
        choices.append((f"{title} ({time})", i))
    
    return choices

def build_demo():
    """构建Gradio界面"""
    global chat_histories, current_chat_index
    
    # 创建自定义主题
    custom_theme = gr.themes.Soft(
        text_size=gr.themes.sizes.text_md,
    )
    
    # 创建界面
    with gr.Blocks(theme=custom_theme, css="""
        .markdown-body :is(h1,h2,h3,h4,h5,h6) { margin-top: 0 !important; }
        .container { max-width: 1200px; margin: auto; }
        .katex { font-size: 1.1em; }
        .katex-display { margin: 1em 0; overflow-x: auto; overflow-y: hidden; }
        .model-description { font-size: 0.9em; color: #666; margin-top: 5px; }
        
        /* 聊天历史样式 */
        .thinking {
            color: #666;
            font-style: italic;
        }
        .history-header {
            margin-bottom: 10px;
            font-weight: bold;
        }
        """) as demo:
        
        gr.HTML("""
        <div style="text-align: center; margin: 0 auto;">
            <div style="display: inline-block; margin: 0 auto; text-align: center">
                <h1>AI Chat Assistant</h1>
                <p>Multi-model AI assistant, enter your question to start the conversation.</p>
            </div>
        </div>
        """)
        
        # 当前聊天的状态变量
        chat_index = gr.State(-1)  # 当前聊天历史的索引
        
        with gr.Row():
            # 左侧面板 - 功能控制
            with gr.Column(scale=1):

                            
                new_chat_btn = gr.Button("New Chat")

                # 改进模型选择器，显示描述
                model_dropdown = gr.Dropdown(
                    choices=[f"{m['name']} - {m['provider']}" for m in MODELS],
                    value=f"{MODELS[0]['name']} - {MODELS[0]['provider']}", 
                    label="Choose model", 
                    interactive=True
                )
                
                model_description = gr.Markdown(
                    value=f"", 
                    elem_classes="model-description",
                )

                # 使用Dropdown组件替代HTML实现历史记录列表
                history_dropdown = gr.Dropdown(
                    choices=get_chat_titles(),
                    label="Choose chat History",
                    interactive=True,
                    allow_custom_value=False
                )
                
            # 右侧面板 - 聊天界面
            with gr.Column(scale=3):
                # 当前聊天标题
                chat_title = gr.Markdown("### New Chat")
                
                chatbot = gr.Chatbot(
                    height=450, 
                    render_markdown=True,
                    latex_delimiters=[
                        {"left": "$$", "right": "$$", "display": True},
                        {"left": "$", "right": "$", "display": False},
                        {"left": "\\(", "right": "\\)", "display": False},
                        {"left": "\\[", "right": "\\]", "display": True},
                    ],
                )
                
                with gr.Row():
                    user_input = gr.Textbox(
                        placeholder="Please Enter Your Question...",
                        container=False,
                        scale=6,
                        show_label=False,
                    )
                    stop_btn = gr.Button("⏸️", scale=1, variant="stop")
                    submit_btn = gr.Button("SEND", scale=1)
        
        # 处理模型切换时更新描述
        def update_model_description(model_choice):
            for model in MODELS:
                if f"{model['name']} - {model['provider']}" == model_choice:
                    return f"**{model['description']}**"
            return ""
        
        model_dropdown.change(
            update_model_description,
            [model_dropdown],
            [model_description]
        )
        
        # 获取选择的模型信息
        def get_model_info(model_choice):
            for model in MODELS:
                if f"{model['name']} - {model['provider']}" == model_choice:
                    return model
            return MODELS[0]
        
        # 处理用户输入和机器人回复的更新
        def user_message_and_response(user_message, history, model_choice, idx):
            global chat_histories, current_chat_index
            
            if not user_message.strip():
                return "", history, idx, gr.update(), gr.update()
            
            # 更新用户消息到聊天界面
            history = history + [(user_message, None)]
            
            # 如果是新对话的第一条消息，创建新的对话历史
            if idx == -1 or len(history) == 1:
                # 生成新对话标题(取前10个字)
                title = user_message[:10] + ("..." if len(user_message) > 10 else "")
                time_str = datetime.now().strftime("%Y-%m-%d %H:%M")
                
                # 创建新的对话记录
                new_chat = {
                    'title': title,
                    'time': time_str,
                    'messages': history,
                    'model': model_choice
                }
                
                # 添加到历史记录并更新当前索引
                chat_histories.append(new_chat)
                current_chat_index = len(chat_histories) - 1
                idx = current_chat_index
                
                # 更新标题
                chat_title_text = f"### {title}"
            else:
                # 更新现有对话
                chat_histories[idx]['messages'] = history
                chat_title_text = f"### {chat_histories[idx]['title']}"
            
            # 返回更新后的状态
            return "", history, idx, chat_title_text, gr.update(choices=get_chat_titles(), value=idx)
        
        def bot_response(history, model_choice, idx):
            global chat_histories
            
            if not history or not history[-1][0]:
                return history
            
            user_message = history[-1][0]
            model_info = get_model_info(model_choice)
            
            # 显示思考中...
            history[-1][1] = "<span class='thinking'>Thinking...</span>"
            yield history
            
            try:
                # 生成AI回复
                for chunk in predict(user_message, history[:-1], model_info):
                    history[-1][1] = chunk
                    
                    # 更新历史记录
                    if 0 <= idx < len(chat_histories):
                        chat_histories[idx]['messages'] = history
                        
                    yield history
            except Exception as e:
                history[-1][1] = f"Error: {str(e)}"
                if 0 <= idx < len(chat_histories):
                    chat_histories[idx]['messages'] = history
                yield history
        
        # 加载选定的历史对话
        def load_chat_history(idx):
            global chat_histories, current_chat_index
            
            # 如果idx是元组，取第二个元素（索引）
            if isinstance(idx, tuple) and len(idx) == 2:
                idx = idx[1]
                
            try:
                if idx is not None and 0 <= idx < len(chat_histories):
                    chat = chat_histories[idx]
                    current_chat_index = idx
                    return chat['messages'], f"### {chat['title']}", idx
            except Exception as e:
                print(f"Errors occured when loading chat history: {e}")
                pass
            
            return [], "### New Chat", -1
        
        # 设置事件处理函数
        submit_btn.click(
            user_message_and_response,
            [user_input, chatbot, model_dropdown, chat_index],
            [user_input, chatbot, chat_index, chat_title, history_dropdown]
        ).then(
            bot_response,
            [chatbot, model_dropdown, chat_index],
            [chatbot]
        )
        
        user_input.submit(
            user_message_and_response,
            [user_input, chatbot, model_dropdown, chat_index],
            [user_input, chatbot, chat_index, chat_title, history_dropdown]
        ).then(
            bot_response,
            [chatbot, model_dropdown, chat_index],
            [chatbot]
        )
        
        # 新对话按钮
        new_chat_btn.click(
            create_new_chat,
            [],
            [chatbot, chat_title]
        ).then(
            lambda: -1,
            [],
            [chat_index]
        )

        # 停止生成按钮
        stop_btn.click(
            stop_generation,
            [],
            []
        )
        
        # 历史记录下拉框选择事件
        history_dropdown.change(
            load_chat_history,
            [history_dropdown],
            [chatbot, chat_title, chat_index]
        )
        
    return demo

# 主程序入口
if __name__ == "__main__":
    demo = build_demo()
    demo.launch(inline=False)