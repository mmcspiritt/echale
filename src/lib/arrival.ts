const units = [
  "cero",
  "un",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
];
const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function under100(value: number): string {
  if (value < 20) return units[value] ?? String(value);
  if (value < 30) return value === 20 ? "veinte" : `veinti${units[value - 20]}`;
  const ten = Math.floor(value / 10);
  const unit = value % 10;
  return unit === 0 ? tens[ten] : `${tens[ten]} y ${units[unit]}`;
}

function under1000(value: number): string {
  if (value < 100) return under100(value);
  if (value === 100) return "cien";
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  return rest === 0 ? hundreds[hundred] : `${hundreds[hundred]} ${under100(rest)}`;
}

export function pesosEnPalabras(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const pesos = Math.floor(rounded);
  const centavos = Math.round((rounded - pesos) * 100);
  const pesoWords =
    pesos === 0 ? "cero pesos" : pesos === 1 ? "un peso" : `${under1000(Math.min(pesos, 999))} pesos`;
  if (centavos === 0) return pesoWords;
  const centavoWords = centavos === 1 ? "un centavo" : `${under100(centavos)} centavos`;
  return pesos === 0 ? centavoWords : `${pesoWords} con ${centavoWords}`;
}

export function formatClockCDMX(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function arrivalSpeech(amount: number, personName: string) {
  return `Recibiste un apoyo de ${pesosEnPalabras(amount)} para ${personName}. Confirmado por CoDi.`;
}

export function bocinaEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("echale-bocina") === "1";
}

export function setBocinaEnabled(enabled: boolean) {
  window.localStorage.setItem("echale-bocina", enabled ? "1" : "0");
}

export function playArrivalChime() {
  const context = new AudioContext();
  const now = context.currentTime;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + index * 0.12 + 0.3);
  });
  window.setTimeout(() => void context.close(), 1200);
}

export function speakArrival(amount: number, personName: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(arrivalSpeech(amount, personName));
  utterance.lang = "es-MX";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function announceArrival(amount: number, personName: string) {
  if (!bocinaEnabled()) return;
  try {
    playArrivalChime();
  } catch {
    // The browser can refuse audio until a gesture. The button already unlocked it.
  }
  window.setTimeout(() => speakArrival(amount, personName), 450);
}
