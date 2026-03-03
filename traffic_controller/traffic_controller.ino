/*
  VITAL ROUTE - TRAFFIC SLAVE RECEIVER
  Controlled by Web Demo via USB Serial
  
  Protocol: "S1,S2,S3\n"
  Where S = 'G' (Green), 'Y' (Yellow), 'R' (Red)
  S1 = TL1 (Road 1)
  S2 = TL2 (Road 3)
  S3 = TL3 (Road 2)

  Example: "G,R,R" -> TL1 Green, TL2 Red, TL3 Red
*/

// ================= PINS CONFIGURATION =================

// --- ROAD 1 (TL1) ---
#define TL1_RED     2
#define TL1_YELLOW  3
#define TL1_GREEN   4

// --- ROAD 3 (TL2) ---
#define TL2_RED     5
#define TL2_YELLOW  6
#define TL2_GREEN   7

// --- ROAD 2 (TL3) ---
#define TL3_RED     8
#define TL3_YELLOW  9
#define TL3_GREEN   10

void setup() {
  Serial.begin(9600);
  
  // Outputs
  pinMode(TL1_RED, OUTPUT); pinMode(TL1_YELLOW, OUTPUT); pinMode(TL1_GREEN, OUTPUT);
  pinMode(TL2_RED, OUTPUT); pinMode(TL2_YELLOW, OUTPUT); pinMode(TL2_GREEN, OUTPUT);
  pinMode(TL3_RED, OUTPUT); pinMode(TL3_YELLOW, OUTPUT); pinMode(TL3_GREEN, OUTPUT);

  // Initial Safe State (All Red)
  setTL(1, 'R');
  setTL(2, 'R');
  setTL(3, 'R');
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim(); // "G,R,R"

    // Parse CSV: Expecting 5 chars or more (G,R,R)
    if (cmd.length() >= 5) {
      char s1 = cmd.charAt(0); // TL1 Status
      char s2 = cmd.charAt(2); // TL2 Status
      char s3 = cmd.charAt(4); // TL3 Status

      setTL(1, s1);
      setTL(2, s2);
      setTL(3, s3);
    }
  }
}

void setTL(int id, char status) {
  int r, y, g;
  
  if (id == 1) { r=TL1_RED; y=TL1_YELLOW; g=TL1_GREEN; }
  else if (id == 2) { r=TL2_RED; y=TL2_YELLOW; g=TL2_GREEN; }
  else { r=TL3_RED; y=TL3_YELLOW; g=TL3_GREEN; }

  // Logic High for Active (Common Cathode assumed)
  digitalWrite(r, status == 'R' ? HIGH : LOW);
  digitalWrite(y, status == 'Y' ? HIGH : LOW);
  digitalWrite(g, status == 'G' ? HIGH : LOW);
}
