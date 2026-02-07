import { Bell, Filter, Menu, Search } from 'lucide-react'
import React from 'react'

function AdminHeader({ sidebarCollapsed, onToggleSidebar, breadcrumb = ['Dashboard'] }) {
    const [theme, setTheme] = React.useState('');
    const [time, setTime] = React.useState(new Date());

    // Theme setup
    React.useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
            document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', prefersDark);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Time updater
    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className='bg-white/-80 backdrop-blur-xl border-b-4 border-[#FDA811] dark:bg-slate-800 dark:border-[#FDA811]/80 px-6 py-4'>
            <div className='flex items-center justify-between'>
                {/* Left: Menu + Header */}
                <div className='flex items-center space-x-4'>
                    <button 
                        className='p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors duration-200' 
                        onClick={onToggleSidebar}
                    >
                        <Menu className='w-6 h-6' />
                    </button>
                    <div>
                        <div className='hidden md:flex items-center space-x-1'>
                            <h1 className='text-md font-bold dark:text-white'>Permit and Licensing Management</h1>
                        </div>
                        <div>
                            <span className='text-xs text-slate-500 dark:text-slate-300 font-bold'>
                                {breadcrumb.join(' > ')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center: Search */}
                <div className='flex-1 max-w-md mx-8'>
                    <div className='relative'>
                        <Search className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-300' />
                        <input 
                            type='text' 
                            placeholder='Search...' 
                            className='w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg placeholder-slate-500 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-orange-300 hover:border-orange-300 transition-all'
                        />
                        <button className='absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white'>
                            <Filter className='w-5 h-5' />
                        </button>
                    </div>
                </div>

                {/* Right: Time + Notification + Dark Mode */}
                <div className='flex items-center space-x-3'>
                    {/* Date & Time */}
                    <div className='text-right text-sm text-gray-800 dark:text-gray-200'>
                        <div className='font-semibold'>{time.toLocaleTimeString()}</div>
                        <div className='text-xs'>
                            {time.toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                    </div>

                    {/* Notification */}
                    <button className='relative rounded-xl p-2 text-slate-600 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer'>
                        <Bell className='w-6 h-6' />
                        <span className='absolute top-0 w-4 h-4 text-white text-xs bg-red-500 rounded-full flex items-center justify-center'>1</span>
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        className='ml-2 rounded-xl p-2 bg-slate-300 text-slate-600 hover:bg-slate-400 dark:bg-slate-700 dark:text-yellow-400 dark:hover:bg-slate-900 transition-colors cursor-pointer'
                        onClick={toggleTheme}
                        aria-label='Toggle dark mode'
                    >
                        {theme === 'dark' ? (
                            // Sun icon for light mode
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                                <path stroke="currentColor" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41"/>
                            </svg>
                        ) : (
                            // Moon icon for dark mode
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke="currentColor" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AdminHeader
