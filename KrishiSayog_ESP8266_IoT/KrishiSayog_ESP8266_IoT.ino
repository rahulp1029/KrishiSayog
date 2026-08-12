#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ----- WIIFI CONFIGURATION -----
const char* ssid = "iPhone";
const char* password = "igris1029@#";

// ----- NODE SERVER CONFIGURATION -----
// 👇 REPLACE THIS WITH YOUR COMPUTER'S LOCAL IPv4 ADDRESS (e.g., http://192.168.1.25:3001/api/telemetry)
const char* NODE_SERVER_URL = "http://192.168.1.100:3001/api/telemetry";

// ----- SENSOR PIN CONFIGURATION -----
#define DHTPIN 4      // D2 pin on NodeMCU/ESP8266
#define DHTTYPE DHT11 // Change to DHT22 if using a DHT22 sensor
#define MOISTURE_PIN A0 // Analog pin for Soil Moisture Sensor

DHT dht(DHTPIN, DHTTYPE);

unsigned long previousMillis = 0;
const long interval = 5000; // Send telemetry every 5 seconds

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connect to Wi-Fi
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected successfully!");
  Serial.print("ESP8266 IP Address: ");
  Serial.println(WiFi.localIP()); 
}

void loop() {
  // Graceful auto-reconnect if WiFi drops
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("\nWiFi reconnected!");
  }

  unsigned long currentMillis = millis();

  // Execute telemetry send block every `interval` milliseconds
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    sendTelemetry();
  }
}

void sendTelemetry() {
  // 1. Read DHT Sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Safe fallback if the physical sensor fails
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor! (Using fallback)");
    humidity = 50.0;
    temperature = 25.0;
  }

  // 2. Read Analog Soil Moisture Sensor
  int rawMoisture = analogRead(MOISTURE_PIN);
  
  // Basic bounds calibration
  int dryValue = 1024;
  int wetValue = 400;
  
  int moisturePercent = map(rawMoisture, dryValue, wetValue, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // 3. Construct JSON Payload using ArduinoJson v6
  StaticJsonDocument<256> doc;
  doc["moisture"] = moisturePercent;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  
  // Optional hardware fallback (since no water sensor is wired to NodeMCU yet)
  doc["waterLevel"] = 85; 

  String requestBody;
  serializeJson(doc, requestBody);

  // 4. Send POST Request to Node Relay Server
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    Serial.print("Sending Telemetry to API: ");
    Serial.println(NODE_SERVER_URL);
    Serial.println("Payload: " + requestBody);

    http.begin(client, NODE_SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Execute HTTP POST
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("Response body: " + response);
    } else {
      Serial.print("HTTP Error code: ");
      Serial.println(httpResponseCode);
    }

    http.end(); // Free resources
  }
}
