from flask_pymongo import PyMongo
from flask import Flask
from config.config import Config

mongo = PyMongo()

def init_db(app: Flask):
    app.config["MONGO_URI"] = Config.MONGO_URI
    mongo.init_app(app)
