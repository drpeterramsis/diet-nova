import React, { useState, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

function BmiModal({ open, onClose }: Props) {
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [hint, setHint] = useState<string>("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const calculateBMI = () => {
    if (!weight || !height) {
      setHint("Please enter both weight and height!");
      setBmi(null);
      setCategory("");
      return;
    }

    setHint("");
    const hMeters = Number(height) / 100;
    const bmiValue = Number((Number(weight) / (hMeters * hMeters)).toFixed(1));
    setBmi(bmiValue);

    if (bmiValue < 18.5) setCategory("Underweight");
    else if (bmiValue < 25) setCategory("Normal weight");
    else if (bmiValue < 30) setCategory("Overweight");
    else setCategory("Obesity");
  };

  const resetAll = () => {
    setWeight("");
    setHeight("");
    setBmi(null);
    setCategory("");
    setHint("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") calculateBMI();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-xl w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-center">BMI Calculator</h2>

        <div className="space-y-4">
          <input
            type="number"
            placeholder="Weight (kg)"
            className="w-full p-2 border rounded-lg"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            onKeyDown={handleKeyDown}
          />
          <input
            type="number"
            placeholder="Height (cm)"
            className="w-full p-2 border rounded-lg"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={calculateBMI}
            className="w-full bg-[var(--color-primary)] text-white p-3 rounded-lg"
          >
            Calculate
          </button>
          <button
            onClick={resetAll}
            className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg"
          >
            Reset
          </button>
        </div>

        {hint && (
          <p className="text-red-500 mt-2 text-center font-medium">{hint}</p>
        )}

        {bmi !== null && !hint && (
          <div className="mt-4 bg-gray-100 p-3 rounded-lg text-center">
            <p className="font-bold text-lg">BMI: {bmi}</p>
            <p className="text-[var(--color-primary-dark)]">{category}</p>
          </div>
        )}

        <button
          className="mt-4 text-center w-full text-[var(--color-primary-dark)]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default BmiModal;
