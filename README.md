# Koda Core — Local AI Assistant

![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![Offline](https://img.shields.io/badge/Offline-100%25-brightgreen)
![No Tokens](https://img.shields.io/badge/No%20Tokens-Free-brightgreen)

**Your personal AI. Offline. No tokens. Forever.**

Koda Core is a fully local AI assistant that runs directly on your desktop. No cloud, no subscriptions, no token fees — just instant, private, and powerful AI at your fingertips.

---

## ✨ Features
- **100% Offline** — Works without internet connection
- **Instant Responses** — No latency, no waiting
- **Code Generation** — Python, JavaScript, and more
- **Document Creation** — Generate spreadsheets, reports, and text
- **Privacy First** — Your data never leaves your device
- **Full Control** — Dashboard with live metrics and chat interface
- **No Tokens** — No API keys, no limits, no recurring fees
- **On-Device** — Runs entirely on your hardware

---

## 🛠 Tech Stack
- Python
- Node.js
- Electron
- React
- Docker

---

## 📂 Project Structure
```text
koda-core/
├── src/
│   ├── ai/
│   ├── api/
│   └── ui/
├── models/
├── data/
├── tests/
├── docs/
├── assets/
├── .gitignore
├── README.md
├── requirements.txt
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9** or higher
- **Node.js 16** or higher (if using desktop app)
- **Docker** (optional)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TheMistaKrips/koda-core.git
   cd koda-core
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **For desktop app (optional):**
   ```bash
   npm install
   npm start
   ```

4. **Or run as a web service:**
   ```bash
   python main.py
   ```

---

## ⚙️ Configuration
Create a `.env` file in the root directory:

```env
MODEL_PATH=./models/your_model
DEVICE=cpu
LOG_LEVEL=info
PORT=8080
```

---

## 💡 Usage

### Basic Commands
- **Chat mode** — Interact with Koda via the chat interface
- **Code generation** — Ask Koda to write code in any language
- **Document creation** — Generate spreadsheets, reports, and more

### Examples
- **Generate Python code:**
  > "Koda: Write a function to sort a list"
- **Generate a spreadsheet:**
  > "Koda: Create a monthly budget table"
- **Ask a question:**
  > "Koda: Explain quantum computing in simple terms"

---

## 🐳 Deployment
For production deployment using Docker:

```bash
docker build -t koda-core .
docker run -p 8080:8080 koda-core
```

---

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 🗺 Roadmap
- [x] Core AI engine (completed)
- [x] Chat interface (completed)
- [x] Code generation (completed)
- [x] Offline support (completed)
- [ ] Multi-model support (planned)
- [ ] Plugin system (planned)
- [ ] Mobile app (planned)
- [ ] Voice input (planned)

---

## 📄 License
**This project is proprietary software.**  
© 2026 German Fetisov. All rights reserved.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without prior written permission from the author.

---

## ⚖️ Disclaimer
THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 📫 Contact
- **Developer:** German Fetisov
- **Email:** [fetisovdev0@gmail.com](mailto:fetisovdev0@gmail.com)
- **GitHub:** [https://github.com/TheMistaKrips](https://github.com/TheMistaKrips)

---
*Made with ❤️ by German Fetisov*