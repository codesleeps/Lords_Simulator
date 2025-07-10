# Lords_Simulator

A FastAPI-based simulation game application with a React frontend.

## Prerequisites

- Python 3.9 or higher
- pip3 (Python package manager)
- Node.js and npm/yarn (for frontend development)

## Installation

### Backend Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Lords_Simulator
   ```

2. **Install Python dependencies**:
   ```bash
   pip3 install -r backend/requirements.txt
   ```

3. **Set up environment variables**:
   - Copy the `.env` file in the backend directory
   - Configure any necessary environment variables (database connections, API keys, etc.)

4. **Grant execute permissions** (if needed):
   ```bash
   chmod +x backend/server.py
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

## Running the Application

### Start the Backend Server

1. **From the project root directory**:
   ```bash
   python3 backend/server.py
   ```

2. **The server will start on**: `http://localhost:8001`

### Start the Frontend (Development Mode)

1. **In a new terminal, navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Start the development server**:
   ```bash
   npm start
   # or
   yarn start
   ```

3. **The frontend will typically run on**: `http://localhost:3000`

## Project Structure

```
Lords_Simulator/
├── backend/
│   ├── .env                 # Environment variables
│   ├── requirements.txt     # Python dependencies
│   └── server.py           # FastAPI server
├── frontend/               # React frontend application
├── tests/                  # Test files
├── backend_test.py         # Backend testing script
├── test_result.md          # Test results
└── README.md              # This file
```

## API Documentation

Once the backend server is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

## Development

### Running Tests

```bash
# Run backend tests
python3 backend_test.py

# Run pytest (if configured)
pytest tests/
```

### Code Formatting

The project uses several code quality tools:

```bash
# Format code with black
black backend/

# Sort imports with isort
isort backend/

# Lint with flake8
flake8 backend/

# Type checking with mypy
mypy backend/
```

## Troubleshooting

### Common Issues

1. **"ModuleNotFoundError: No module named 'fastapi'"**
   - Solution: Install dependencies with `pip3 install -r backend/requirements.txt`

2. **"zsh: command not found: python"**
   - Solution: Use `python3` instead of `python`

3. **"Permission denied" when running the server**
   - Solution: Grant execute permissions with `chmod +x backend/server.py`

4. **Port already in use**
   - Solution: Kill any existing processes on port 8001 or modify the port in the server configuration

### Dependencies

The project uses the following key dependencies:
- **FastAPI**: Web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **MongoDB**: Database (via PyMongo and Motor)
- **Pydantic**: Data validation and settings management
- **JWT**: Authentication
- **Boto3**: AWS SDK (if using AWS services)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

[Add your license information here]

---

**Note**: This application was set up and tested on macOS. Additional steps may be required for other operating systems.
