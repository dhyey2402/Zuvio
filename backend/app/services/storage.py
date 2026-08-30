import boto3
import uuid
import re
from botocore.exceptions import ClientError
from botocore.config import Config
from app.core.config import settings
from typing import Dict, Any

class StorageService:
    def __init__(self):
        self.bucket_name = settings.STORAGE_BUCKET_NAME
        # Use signature_version s3v4
        boto_config = Config(
            region_name=settings.STORAGE_REGION,
            signature_version='s3v4'
        )
        
        # Check if we have credentials (may be absent in testing/local dev without env setup)
        if settings.STORAGE_ACCESS_KEY and settings.STORAGE_SECRET_KEY:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.STORAGE_ENDPOINT_URL,
                aws_access_key_id=settings.STORAGE_ACCESS_KEY,
                aws_secret_access_key=settings.STORAGE_SECRET_KEY,
                config=boto_config
            )
        else:
            self.s3_client = None

    def generate_safe_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal and remove dangerous characters."""
        # Remove null bytes
        filename = filename.replace('\0', '')
        # Remove path separators
        filename = filename.replace('/', '').replace('\\', '')
        # Keep only alphanumeric, dash, underscore, and dot
        filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
        # Prevent completely empty filenames
        if not filename:
            filename = 'unnamed_file'
        # Prevent excessive length
        return filename[:255]

    def generate_storage_path(self, user_id: uuid.UUID, original_filename: str) -> str:
        """Generate a predictable but secure storage path."""
        file_uuid = uuid.uuid4()
        safe_filename = self.generate_safe_filename(original_filename)
        return f"users/{user_id}/files/{file_uuid}/{safe_filename}"

    def generate_presigned_post(self, storage_path: str, mime_type: str, max_size: int) -> Dict[str, Any]:
        """
        Generate a presigned POST URL and fields for direct client upload.
        Validates content-length-range to enforce max_size.
        """
        if not self.s3_client:
            raise RuntimeError("Storage client not configured.")

        # Conditions for the presigned POST
        conditions = [
            ["starts-with", "$Content-Type", mime_type],
            ["content-length-range", 1, max_size]
        ]
        
        fields = {
            "Content-Type": mime_type
        }

        try:
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=storage_path,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=3600  # 1 hour expiration
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to generate presigned POST: {str(e)}")

    def generate_presigned_get(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate a short-lived download URL."""
        if not self.s3_client:
            raise RuntimeError("Storage client not configured.")
            
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': storage_path
                },
                ExpiresIn=expires_in
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to generate presigned GET: {str(e)}")

    def check_object_exists(self, storage_path: str) -> bool:
        """Check if an object exists in the storage bucket."""
        if not self.s3_client:
            # During testing without a real S3 backend, we might want to return True or mock this
            return False
            
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=storage_path)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise Exception(f"Failed to check object existence: {str(e)}")

    def delete_object(self, storage_path: str) -> None:
        """Delete an object from the storage bucket."""
        if not self.s3_client:
            return
            
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=storage_path)
        except ClientError as e:
            raise Exception(f"Failed to delete object: {str(e)}")

storage_service = StorageService()
