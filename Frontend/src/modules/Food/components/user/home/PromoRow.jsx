import React from 'react';

export default function PromoRow({ handleVegModeChange, navigate, isVegMode, toggleRef, heroVideo }) {
  const promoCardsData = [
    {
      id: 'offers',
      title: "MIN.",
      value: "40% off",
      icon: "https://img.icons8.com/3d-fluency/256/discount.png",
      bgColor: "bg-rose-100 dark:bg-rose-900/60",
      borderColor: "border-rose-200 dark:border-rose-800/80",
      textColor: "text-rose-600 dark:text-rose-300",
    },
    {
      id: 'pure-veg',
      title: "PURE",
      value: "Veg",
      icon: "https://img.icons8.com/fluency/256/leaf.png",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/60",
      borderColor: "border-emerald-200 dark:border-emerald-800/80",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
    {
      id: 'under-250',
      title: "UNDER",
      value: "\u20B9250",
      icon: "https://img.icons8.com/3d-fluency/256/coins.png",
      bgColor: "bg-amber-100 dark:bg-amber-900/60",
      borderColor: "border-amber-200 dark:border-amber-800/80",
      textColor: "text-amber-700 dark:text-amber-300",
    },
  ];

  return (
    <div className={`px-4 pt-4 pb-8 ${heroVideo ? 'bg-transparent' : 'bg-white dark:bg-[#0a0a0a]'} min-h-[145px]`}>
      {/* Cards removed as requested. Maintaining height. */}
    </div>
  );
}
