from app import create_app
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

logging.info("Test log from run.py")

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5001) 