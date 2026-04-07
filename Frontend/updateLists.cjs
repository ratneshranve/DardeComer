const fs = require('fs');
const path = require('path');

const homePath = path.join('c:', 'Users', 'Abcom', 'Desktop', 'DardeComer', 'Frontend', 'src', 'modules', 'Food', 'pages', 'user', 'Home.jsx');
let code = fs.readFileSync(homePath, 'utf8');

const newComponents = `
// Memoized Components for Performance (Categories & Filters)
const MemoizedCategoryItem = React.memo(({ category, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
  >
    <Link 
      to={\`/food/user/category/\${category.slug}\`}
      className="flex flex-col items-center gap-2 group"
    >
      <motion.div 
        whileTap={{ scale: 0.95 }}
        whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,26,148,0.12)" }}
        className="relative w-full aspect-square rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] transition-all duration-300"
      >
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 + index * 0.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] w-[150%] h-full"
          />
        </div>
        <OptimizedImage 
          src={category.image} 
          alt={category.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </motion.div>
      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight tracking-tight group-hover:text-[#001A94] transition-colors">
        {category.name}
      </span>
    </Link>
  </motion.div>
));

const MemoizedFilterButton = React.memo(({ filter, isActive, onToggle }) => {
  const Icon = filter.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      type="button"
      onClick={() => onToggle(filter.id)}
      className={\`h-9 px-4 rounded-full flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-colors font-bold shadow-sm \${
        isActive
          ? "bg-gradient-to-r from-[#001A94] to-blue-700 text-white border-transparent text-shadow-sm shadow-blue-500/20"
          : "bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
      }\`}
    >
      {Icon && <Icon className={\`h-3.5 w-3.5 \${isActive ? "fill-white/20" : ""}\`} />}
      <span className="text-xs font-bold tracking-tight uppercase">{filter.label}</span>
    </motion.button>
  );
});

export default function Home`;

// Insert the memoized components before "export default function Home"
code = code.replace("export default function Home", newComponents);


// Replace category rendering
const categoryRegex = /\{displayCategories\.slice\(0, 8\)\.map\(\(category, index\) => \([\s\S]*?<\/Link>\s*\)\)\}/;
code = code.replace(categoryRegex, '{displayCategories.slice(0, 8).map((category, index) => <MemoizedCategoryItem key={category.id || index} category={category} index={index} />)}');


// Find the applyFiltersAndRefetch block (lines 2627 to 2669)
// It looks like:
// {[ { id: "delivery-under-30", label: "Under 30 mins" }, ... ].map((filter) => { const Icon = filter.icon; ... })}
const filterRegex = /\{\[\s*\{\s*id:\s*"delivery-under-30"[\s\S]*?\}\)\}\s*\]\.map\(\(filter\) => \{[\s\S]*?return \([\s\S]*?<\/button>\s*\);\s*\}\)\}/;

const filterReplacement = `{[
  { id: "delivery-under-30", label: "Under 30 mins" },
  { id: "delivery-under-45", label: "Under 45 mins" },
  { id: "distance-under-1km", label: "Under 1km", icon: MapPin },
  { id: "distance-under-2km", label: "Under 2km", icon: MapPin },
].map((filter) => (
  <MemoizedFilterButton 
    key={filter.id} 
    filter={filter} 
    isActive={activeFilters.has(filter.id)} 
    onToggle={(filterId) => {
      const nextFilters = new Set(activeFilters);
      if (nextFilters.has(filterId)) {
        nextFilters.delete(filterId);
      } else {
        nextFilters.add(filterId);
      }
      setActiveFilters(nextFilters);
      applyFiltersAndRefetch(nextFilters, sortBy, selectedCuisine);
    }} 
  />
))}`;

code = code.replace(filterRegex, filterReplacement);

fs.writeFileSync(homePath, code, 'utf8');
console.log('Successfully optimized Home.jsx lists!');
