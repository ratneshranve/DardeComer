import React from 'react';

export default function PromoRow({ handleVegModeChange, navigate, isVegMode, toggleRef }) {
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
    <div className="grid grid-cols-3 gap-3 px-4 pt-4 pb-8 bg-white dark:bg-[#0a0a0a]">
      {promoCardsData.map((promo, idx) => (
        <div
          key={idx}
          ref={promo.id === 'pure-veg' ? toggleRef : null}
          className={`${promo.bgColor} ${promo.borderColor} rounded-[1.8rem] p-1 flex flex-col items-center h-[145px] shadow-md border transition-transform duration-300 cursor-pointer active:scale-95 hover:-translate-y-1 hover:shadow-xl ${
            promo.id === 'pure-veg' && isVegMode ? 'ring-2 ring-emerald-500 bg-emerald-200 dark:bg-emerald-800/80' : ''
          }`}
          onClick={() => {
            if (promo.id === 'pure-veg') handleVegModeChange(!isVegMode);
            else if (promo.id === 'offers') navigate('/food/user/offers');
            else if (promo.id === 'under-250') navigate('/food/user/under-250');
          }}
        >
          <div className="py-3 px-1 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 tracking-[0.1em] uppercase leading-none mb-1">
              {promo.title}
            </span>
            <span className={`text-sm font-black ${promo.textColor} leading-none truncate w-full px-1`}>
              {promo.value}
            </span>
          </div>

          <div className="flex-1 w-full bg-white dark:bg-[#1a1a1a] rounded-[1.8rem] shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center justify-center p-2 mb-1 overflow-hidden">
            <img
              src={promo.icon}
              alt={promo.value}
              className="w-[85%] h-[85%] object-contain drop-shadow-md"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
