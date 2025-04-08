import time
from picamera2 import Picamera2, Preview
import boto3
from botocore.exceptions import NoCredentialsError
import libcamera

def capture_image(file_path):
    try:
        picam2 = Picamera2()
       
        config = picam2.create_still_configuration(
            main={"size": (1024, 768)},
            lores={"size": (640, 640)},
            display="lores",
            transform=libcamera.Transform(vflip=1, hflip=1)
        )
        picam2.configure(config)

        picam2.start()
        time.sleep(1)
        picam2.capture_file(file_path)
        picam2.stop()

        print(f"Image captured: {file_path}")

    except Exception as e:
        print(f"Error capturing image: {e}")
    finally:
        picam2.close()

def upload_to_s3(file_path, bucket_name, object_name):
    aws_access_key_id = "x"
    aws_secret_access_key = "x"
    s3 = boto3.client('s3', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)
    try:
        s3.upload_file(file_path, bucket_name, object_name)
        print(f"File uploaded to S3: s3://{bucket_name}/{object_name}")
        return True
    except FileNotFoundError:
        print("The file was not found.")
        return False
    except NoCredentialsError:
        print("Credentials not available or incorrect.")
        return False

def capture(client):
    desktop_image_path = '/home/team57bytesized/Desktop/Images/'
    bucket_name = "raspi-bucket-mushroom"
    timestamp = time.strftime("%Y%m%d%H%M%S")

    image_file_path = desktop_image_path + f"captured_image_{timestamp}.jpg"
    capture_image(image_file_path)
    if upload_to_s3(image_file_path, bucket_name, f"captured_image_{timestamp}.jpg"):
        client.publish("your/result/channel", f"captured_image_{timestamp}.jpg")
