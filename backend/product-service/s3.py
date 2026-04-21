import os
from pathlib import Path
from uuid import uuid4

import boto3
from botocore.client import BaseClient
from fastapi import UploadFile


class S3Uploader:
    def __init__(self) -> None:
        self.bucket_name = os.getenv("BUCKET_NAME", "").strip()
        self.client: BaseClient = boto3.client("s3")

    def _build_key(self, filename: str | None) -> str:
        ext = Path(filename or "").suffix
        if len(ext) > 10:
            ext = ""
        return f"products/{uuid4()}{ext}"

    async def upload_image(self, file: UploadFile) -> str:
        if not self.bucket_name:
            raise ValueError("BUCKET_NAME is required")

        if not file.content_type or not file.content_type.startswith("image/"):
            raise ValueError("Only image files are allowed")

        key = self._build_key(file.filename)
        self.client.upload_fileobj(
            file.file,
            self.bucket_name,
            key,
            ExtraArgs={"ContentType": file.content_type},
        )

        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=3600,
        )


s3_uploader = S3Uploader()
