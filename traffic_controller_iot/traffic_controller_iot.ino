/*
  VITAL ROUTE - IoT TRAFFIC CONTROLLER (ESP32 / ESP8266)
  Controlled via Firebase Realtime Database
  
  Board: ESP32 Dev Module or NodeMCU (ESP8266)
  Libraries Required: 
  1. Firebase ESP Client (by Mobizt)
  2. WiFi
*/

#if defined(ESP32)
  #include <WiFi.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
#endif

#include <Firebase_ESP_Client.h>

// Provide the token generation process info.
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info and other helper functions.
#include "addons/RTDBHelper.h"

// ================= CREDENTIALS =================
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Project Info
#define API_KEY "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "https://studio-9661130949-2b190-default-rtdb.firebaseio.com/" // From your firebase.js

// ================= PINS =================
// Note: ESP32-S3-N16R8 Pin Mapping
// Avoid pins: 0 (BOOT), 19/20 (USB), 35-37 (Octal Flash), 43/44 (UART0)
// Recommended Safe Pins: 4-18 (check your specific devkit)

#define TL1_RED     4
#define TL1_YELLOW  5
#define TL1_GREEN   6

#define TL2_RED     7
#define TL2_YELLOW  15
#define TL2_GREEN   16

#define TL3_RED     17
#define TL3_YELLOW  18
#define TL3_GREEN   8

// ================= GLOBALS =================
FirebaseData fbDO;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  
  // 1. PIN SETUP
  pinMode(TL1_RED, OUTPUT); pinMode(TL1_YELLOW, OUTPUT); pinMode(TL1_GREEN, OUTPUT);
  pinMode(TL2_RED, OUTPUT); pinMode(TL2_YELLOW, OUTPUT); pinMode(TL2_GREEN, OUTPUT);
  pinMode(TL3_RED, OUTPUT); pinMode(TL3_YELLOW, OUTPUT); pinMode(TL3_GREEN, OUTPUT);
  
  // Test Sequence
  digitalWrite(TL1_RED, HIGH); delay(500); digitalWrite(TL1_RED, LOW);

  // 2. WI-FI CONNECT
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // 3. FIREBASE CONNECT
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  // Anonymous Sign-in
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Connected");
    signupOK = true;
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  // Optimize for RTDB Stream
  config.token_status_callback = tokenStatusCallback;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // 4. STREAM SETUP (Listen for changes)
  if (!Firebase.RTDB.beginStream(&fbDO, "/traffic_signals/demo_junction")) {
      Serial.printf("Stream begin error: %s\n", fbDO.errorReason().c_str());
  }
}

// ================= LOOP =================
void loop() {
  if (signupOK) {
      if (!Firebase.RTDB.readStream(&fbDO)) {
          Serial.printf("Stream read error: %s\n", fbDO.errorReason().c_str());
      }

      if (fbDO.streamTimeout()) {
          Serial.println("Stream timeout, resume...");
      }

      if (fbDO.streamAvailable()) {
          // Data Format: JSON Object specific to the node changed OR entire object
          // Typically we receive the whole JSON if listening to parent
          if (fbDO.dataType() == "json") {
              FirebaseJson *json = fbDO.jsonObjectPtr();
              String jsonString;
              json->toString(jsonString, true);
              Serial.println("Update: " + jsonString);
              
              // Parse States
              FirebaseJsonData result;
              
              // ROAD 1 (TL1)
              json->get(result, "tl1");
              if (result.success) updateLight(1, result.stringValue.c_str()[0]);
              
              // ROAD 2 (TL3) - Note swapping for consistency with web demo ID
              json->get(result, "tl3");
              if (result.success) updateLight(3, result.stringValue.c_str()[0]);
              
              // ROAD 3 (TL2)
              json->get(result, "tl2");
              if (result.success) updateLight(2, result.stringValue.c_str()[0]);
          }
      }
  }
}

// ================= HELPERS =================

void updateLight(int id, char status) {
  int r, y, g;
  // Map IDs to Pins
  if (id == 1) { r = TL1_RED; y = TL1_YELLOW; g = TL1_GREEN; }
  else if (id == 2) { r = TL2_RED; y = TL2_YELLOW; g = TL2_GREEN; }
  else { r = TL3_RED; y = TL3_YELLOW; g = TL3_GREEN; }

  // Set Pins
  digitalWrite(r, status == 'R' ? HIGH : LOW);
  digitalWrite(y, status == 'Y' ? HIGH : LOW);
  digitalWrite(g, status == 'G' ? HIGH : LOW);
}
