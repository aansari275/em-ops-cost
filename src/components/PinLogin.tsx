import { useState, useRef, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

const CORRECT_PIN = '1234';
const AUTH_KEY = 'ops_cost_auth';

interface PinLoginProps {
  onSuccess: () => void;
}

export function PinLogin({ onSuccess }: PinLoginProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Only take last digit
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (index === 3 && value) {
      const fullPin = newPin.join('');
      if (fullPin === CORRECT_PIN) {
        localStorage.setItem(AUTH_KEY, 'true');
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(pasted)) return;

    const newPin = [...pin];
    for (let i = 0; i < pasted.length && i < 4; i++) {
      newPin[i] = pasted[i];
    }
    setPin(newPin);

    if (pasted.length === 4) {
      if (pasted === CORRECT_PIN) {
        localStorage.setItem(AUTH_KEY, 'true');
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }, 500);
      }
    } else {
      inputRefs.current[Math.min(pasted.length, 3)]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
          OPS Cost Tracker
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Enter PIN to continue
        </p>

        {/* PIN Inputs */}
        <div
          className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}
          onPaste={handlePaste}
        >
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                ${error
                  ? 'border-red-400 bg-red-50'
                  : digit
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>Incorrect PIN</span>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">
          Eastern Mills Accounts
        </p>
      </div>

      {/* Shake Animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
