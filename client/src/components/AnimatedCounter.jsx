import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { formatCurrency } from '../utils/currencyFormatter';

export const AnimatedCounter = ({
  value = 0,
  duration = 1200,
  currency = 'INR',
  showPlusSign = false,
  isCurrency = true
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    if (!isInView) {
      setCurrentVal(0);
      return;
    }

    let animationFrameId;
    let startTimestamp = null;
    const targetVal = typeof value === 'number' && !isNaN(value) ? value : 0;
    const absTarget = Math.abs(targetVal);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Fast start, smooth deceleration ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const calculated = absTarget * easeProgress;
      
      setCurrentVal(calculated);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentVal(absTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, value, duration]);

  const numVal = typeof value === 'number' && !isNaN(value) ? value : 0;
  const isPositive = numVal >= 0;
  const signPrefix = showPlusSign ? (isPositive ? '+' : '-') : (numVal < 0 ? '-' : '');

  if (!isCurrency) {
    const rounded = Math.round(currentVal);
    return (
      <span ref={ref}>
        {signPrefix}{rounded}
      </span>
    );
  }

  const formatted = formatCurrency(currentVal, currency);
  return (
    <span ref={ref}>
      {signPrefix}{formatted}
    </span>
  );
};
