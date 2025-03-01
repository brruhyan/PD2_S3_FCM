import paho.mqtt.client as mqtt

from s3_example import capture

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

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect("192.168.1.16", 1883, 60)
print("Listening Forever")
try:
    mqtt_client.loop_forever()
except:
    print("Something Happened!")