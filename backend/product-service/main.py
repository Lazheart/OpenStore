from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    response = {"message": "Hello, World!"}
    return response