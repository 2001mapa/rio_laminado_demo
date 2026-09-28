const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/ClientLayout.tsx', 'utf8');

const oldAlertPos = `<div className="fixed bottom-24 left-4 right-4 md:left-auto md:bottom-8 md:right-8 z-[100] flex flex-col gap-3 pointer-events-none md:w-80">`;
const newAlertPos = `<div className="fixed top-20 left-4 right-4 md:top-auto md:left-auto md:bottom-8 md:right-8 z-[100] flex flex-col gap-3 pointer-events-none md:w-80">`;

if (code.includes(oldAlertPos)) {
  code = code.replace(oldAlertPos, newAlertPos);
  fs.writeFileSync('src/app/cliente/ClientLayout.tsx', code);
  console.log('Fixed statusAlerts position for mobile');
} else {
  console.log('Failed to match statusAlerts position');
}
