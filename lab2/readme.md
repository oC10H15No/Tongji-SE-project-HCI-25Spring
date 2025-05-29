# HCI Asssignment #2: LLM Multi-Model Chat System - README

## Overview
This project implements a graphical interface for interacting with various Large Language Models (LLMs) via API using the Gradio framework. The system allows users to select different models, start new conversations, record historical interactions, and switch between providers seamlessly.

The application supports the following features:
- Connection to at least **three different LLM providers**: DashScope, OpenRouter, DeepSeek.
- Interactive web-based chat UI designed with Gradio.
- Support for **multi-turn conversation** and conversation history browsing.
- Model selection and clear separation of UI controls and chat content.
- **Historical conversation record**: users can select and continue previous conversations.

- **Streaming output**: LLM responses are displayed in real-time as they are generated.

- **LaTeX mathematical formula support**: chat display fully supports LaTeX rendering for mathematical expressions.

---

## How to Run

### 1. Requirements
- Python 3.13 or later
- Virtual Environment Recommended

Install dependencies with:
```bash
pip install gradio openai
```

### 2. Running the Program
Execute the main script:
```bash
python __main__.py
```

After launching, the Gradio interface will automatically open in your web browser at:
```
http://127.0.0.1:7860
```

---

## Authors
- Yang Ruichen (2351050)
- Zhang Qizheng (2350989)

---

## Completed Course Requirements

| Task                                                  | Status      |
|-------------------------------------------------------|-------------|
| Basic dialogue using LLM API (single-round)           | Completed ✅ |
| Multi-turn dialogue with conversation memory          | Completed ✅ |
| History record: select past conversation to continue  | Completed ✅ |
| User-friendly interface design                        | Completed ✅ |
| Compare API differences across models                 | Analyzed ✅ |
| Parameter impact (temperature, top_p, system messages)| Analyzed ✅  |
| Prompt design strategies (daily & professional use)   | Analyzed ✅  |

The system fully meets the assignment requirements and provides extended discussion in the attached report.

---

## Notes
- API keys must be provided before execution. 
- Tested on Python 3.13, Windows 11, and Arch Linux.







