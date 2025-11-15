import React, { useState } from 'react';

const BMI: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState('');

  const toggleVisibility = () => {
    setVisible(!visible);
    setHint('');
    setBmi(null);
  };

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;

    if (!w || !h) {
      setHint('Please enter both weight and height!');
      setBmi(null);
      return;
    }

    const result = w / (h * h);
    setBmi(parseFloat(result.toFixed(2)));
    setHint('');
  };

  return (
    <div className="w-full flex flex-col items-center mt-5">
      <button
        onClick={toggleVisibility}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        BMI Calculator
      </button>

      {/* Slide Down BMI Card */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out w-80 ${
          visible ? 'max-h-[500px] mt-4 opacity-100 translate-y-0' : 'max-h-0 mt-0 opacity-0 -translate-y-10'
        }`}
      >
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">BMI Calculator</h2>

          <div className="mb-3">
            <label className="block mb-1">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            onClick={calculateBMI}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Calculate
          </button>

          {hint && <p className="mt-2 text-red-500 text-center">{hint}</p>}
          {bmi && !hint && (
            <p className="mt-4 text-center font-semibold">
              Your BMI: {bmi}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMI;
