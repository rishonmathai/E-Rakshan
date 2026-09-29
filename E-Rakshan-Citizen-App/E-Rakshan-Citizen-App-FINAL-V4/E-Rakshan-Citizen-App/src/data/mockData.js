export const demoUser = {
  name: "Citizen User",
  phone: "+91 9876543210",
  language: "English",
  dob: "1998-06-15",
  gender: "Not specified",
  bloodGroup: "O+",
  address: "Panvel, Maharashtra",
  emergencyContactName: "Family Contact",
  emergencyContactPhone: "+91 9876543210",
  emergencyContactRelation: "Family",
  medicalNotes: "",
  profileComplete: true
};

export const alerts = [
  {
    id: "a1", severity: "Critical", type: "Weather",
    title: "Heavy Rainfall Warning",
    message: "High intensity rainfall expected in your area in the next 6 hours.",
    location: "Panvel region", lat: 18.9894, lng: 73.1175, time: "10 min ago", unread: true
  },
  {
    id: "a2", severity: "Warning", type: "Road",
    title: "Road Blocked",
    message: "NH 66 section is affected due to landslide. Avoid the marked road.",
    location: "Khalapur", lat: 18.8322, lng: 73.2885, time: "25 min ago", unread: true
  },
  {
    id: "a3", severity: "Critical", type: "Hazard",
    title: "Red Zone Alert",
    message: "High-risk zone declared near Choramala. Avoid this area.",
    location: "Choramala", lat: 11.5524, lng: 76.0937, time: "1 hour ago", unread: false
  },
  {
    id: "a4", severity: "Advisory", type: "Shelter update",
    title: "Shelter Update",
    message: "New shelter opened at Govt. Higher Secondary School.",
    location: "Panamaram", lat: 11.7392, lng: 76.0738, time: "2 hours ago", unread: false
  },
  {
    id: "a5", severity: "Advisory", type: "Weather",
    title: "Weather Advisory",
    message: "Moderate to heavy rain expected. Keep an emergency kit ready.",
    location: "Navi Mumbai", lat: 19.0330, lng: 73.0297, time: "3 hours ago", unread: false
  }
];

export const shelters = [
  { id: "s1", name: "Govt. Higher Secondary School", area: "Panamaram", distance: 1.2, capacity: 450, status: "Open", medical: true, accessible: true, family: true, lat: 19.001, lng: 73.115 },
  { id: "s2", name: "Community Hall", area: "Vellamunda", distance: 2.4, capacity: 300, status: "Open", medical: false, accessible: true, family: true, lat: 19.012, lng: 73.132 },
  { id: "s3", name: "St. Joseph's School", area: "Mundakkai", distance: 3.1, capacity: 200, status: "Open", medical: true, accessible: false, family: true, lat: 18.987, lng: 73.145 },
  { id: "s4", name: "Panchayat Building", area: "Meppadi", distance: 4.5, capacity: 150, status: "Open", medical: false, accessible: true, family: false, lat: 18.972, lng: 73.104 }
];

export const mapPoints = {
  redZones: [
    { id: "rz1", name: "Choramala Red Zone", lat: 19.005, lng: 73.125, radius: 900 },
    { id: "rz2", name: "Landslide Risk Area", lat: 18.992, lng: 73.150, radius: 650 }
  ],
  hazards: [
    { id: "h1", name: "Heavy Rainfall", lat: 19.018, lng: 73.102 },
    { id: "h2", name: "Landslide Risk", lat: 18.981, lng: 73.122 },
    { id: "h3", name: "Flood Risk", lat: 19.028, lng: 73.140 }
  ],
  roads: [
    { id: "r1", name: "NH 66 blockage", lat: 19.008, lng: 73.098, status: "Blocked" },
    { id: "r2", name: "Main Road", lat: 19.020, lng: 73.118, status: "Caution" }
  ],
  incidents: [
    { id: "i1", name: "Reported waterlogging", lat: 19.010, lng: 73.108 }
  ]
};

export const guidelines = {
  Before: [
    { title:"Prepare an emergency kit.", details:"Keep water, medicines, torch, power bank, ID copies and essential food ready. Store them where you can reach them quickly, and include any essential medicines or mobility aids needed by family members.", situation:"All emergencies" },
    { title:"Follow official alerts and instructions.", details:"Use only verified government information. Keep notifications enabled, check the source and time of an alert, and avoid forwarding unverified emergency messages.", situation:"All emergencies" },
    { title:"Know your nearest designated shelter.", details:"Save a nearby designated shelter and at least one backup route. Open the map while online so the same map area and route data can be cached before connectivity is lost.", situation:"Evacuation" },
    { title:"Save emergency contacts.", details:"Keep family contacts, local authorities/control-room numbers and 112 available. Test that the important numbers can be called from your device.", situation:"All emergencies" },
    { title:"Charge your phone and power bank.", details:"Keep enough battery for calls, location sharing and emergency updates. Carry a power bank and reduce non-essential battery use if an outage is expected.", situation:"Before severe weather" },
    { title:"Secure important documents.", details:"Keep identification and essential records protected and accessible. Use secure digital copies where appropriate and avoid sharing sensitive documents through unknown links.", situation:"Flood / Fire / Evacuation" },
    { title:"Plan for children, older adults and people with disabilities.", details:"Assign a family contact and identify mobility, communication or medical needs in advance. Confirm who will help children, older adults or people who need assistance.", situation:"Family preparedness" },
    { title:"Avoid entering known hazard zones.", details:"Do not wait for visible danger before following an official evacuation advisory. Leave early when instructed and use designated routes rather than shortcuts through hazard areas.", situation:"Landslide / Flood / Fire" }
  ],
  During: [
    { title:"Follow government instructions.", details:"Follow current instructions from authorized authorities and use designated safe routes. If an official evacuation order is issued, carry your essential kit and avoid unnecessary stops.", situation:"All emergencies" },
    { title:"Move away from danger zones.", details:"Do not cross barricades or return to an area under an active warning. A road that looks passable can still have hidden flood, structural or electrical hazards.", situation:"All emergencies" },
    { title:"Avoid rivers, low-lying areas and bridges.", details:"Water levels can rise quickly even when rainfall has stopped. Never drive or walk through moving water, and avoid bridges, drains and underpasses during flooding.", situation:"Flood / Heavy rain" },
    { title:"Avoid blocked roads and unstable slopes.", details:"Use the safest available route and never drive through moving water. Turn back from unstable slopes, debris or barricades instead of trying to cross.", situation:"Landslide / Flood" },
    { title:"During an earthquake, protect yourself first.", details:"Drop, cover and hold on. After shaking stops, move away from damaged structures, broken glass and exposed wires and follow official instructions before travelling.", situation:"Earthquake" },
    { title:"During a fire, move to fresh air and exit safely.", details:"Use stairs, avoid lifts, stay low in smoke and follow fire-service directions. If smoke blocks an exit, use another safe exit rather than moving through dense smoke.", situation:"Fire" },
    { title:"During lightning, move indoors.", details:"Avoid open fields, isolated trees, water bodies and exposed metal structures. Move into a substantial enclosed building or vehicle and wait for official/local weather guidance.", situation:"Lightning / Thunderstorm" },
    { title:"Keep your emergency location sharing active.", details:"If safe to do so, keep GPS enabled and use the Family Safety Circle or SOS sharing tools as appropriate. Stop sharing when it is no longer needed.", situation:"Emergency assistance" }
  ],
  After: [
    { title:"Wait for official clearance before returning.", details:"A hazard can remain after the visible event has ended. Wait for an official all-clear before returning and check for secondary risks.", situation:"All emergencies" },
    { title:"Avoid damaged infrastructure.", details:"Stay away from unstable buildings, fallen wires, damaged bridges and contaminated water. Do not touch downed electrical lines and report urgent hazards through authorized channels.", situation:"Post-disaster" },
    { title:"Report hazards through authorized channels.", details:"Use the app or local authorities to report blocked roads, damage or urgent risks. Include the location and a concise description when it is safe to do so.", situation:"Post-disaster" },
    { title:"Help vulnerable people safely when possible.", details:"Assist children, older adults and people with disabilities when it is safe. Do not put yourself or others into a hazardous area while helping.", situation:"Recovery" },
    { title:"Check family members and emergency contacts.", details:"Confirm everyone is safe using the Family Safety Circle, calls or messages before travelling unnecessarily. Keep updates short if networks are congested.", situation:"Recovery" },
    { title:"Preserve important information.", details:"Keep official alerts, instructions and incident details available for follow-up. Record important times or reference numbers if authorities provide them.", situation:"Recovery" }
  ]
};