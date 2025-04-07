import paho.mqtt.client as mqtt
from s3_example import capture
from flask import Flask
import threading

app = Flask(__name__)
mqtt_client = mqtt.Client()

@app.route('/takePhoto', methods = ['GET', 'POST'])
def index():
    mqtt_client.publish("your/command/channel", "Yes")
    return b"Photo request sent"
   

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("your/command/channel")

def on_message(mqtt_client, userdata, msg):
    print(f"Received message on topic {msg.topic}: {msg.payload}")
    if msg.payload == b"Yes":
        try:
            capture(mqtt_client)
            print("Images Captured Successfully")
        except Exception as e:
            print(e)
    else:
        print("Not taking a photo")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect("10.147.20.61", 1883, 60)
print("Listening Forever")

# Run Flask app in a separate thread
def run_flask():
    app.run(host='10.147.20.61', port=3000)

if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()
    print('Server running on raspi')

    try:
        mqtt_client.loop_forever()
    except Exception as e:
        print(f"Something Happened! {e}")
