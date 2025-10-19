// src/components/AnimatedStatusPanel.tsx

import { MessageSquare, Zap, Clock } from 'lucide-react';
import { useRef, useEffect } from 'react'; // 👈 Import hooks

// Sample data for the scrolling activity feed
const activities = [
  { icon: MessageSquare, text: "Knockout Bracket initiated.", color: "text-red-500" },
  { icon: Clock, text: "Group stage status: 75% complete.", color: "text-blue-500" },
  { icon: Zap, text: "New team 'Phoenix FC' added to Group D.", color: "text-yellow-500" },
  { icon: MessageSquare, text: "Score submitted: A1 vs B4 (3-1).", color: "text-green-500" },
  { icon: Clock, text: "Fixture generated for Group C.", color: "text-blue-500" },
  { icon: Zap, text: "Admin logged in from IP 192.168.1.1.", color: "text-yellow-500" },
  // Adding more entries to ensure scrolling is visible
  { icon: MessageSquare, text: "User 'JaneDoe' updated tournament name.", color: "text-green-500" },
  { icon: Clock, text: "Match C2 vs C4 rescheduled to 18:00.", color: "text-blue-500" },
  { icon: Zap, text: "System check: Database connection nominal.", color: "text-yellow-500" },
  { icon: MessageSquare, text: "FINAL: G1 winner defeated S2 winner (2-1).", color: "text-red-500" },
];

const AnimatedStatusPanel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever the activities list changes (or component loads)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]); // Dependency array ensures it runs when 'activities' update (in a real app)

  return (
    <div className="lg:col-span-1 p-4 rounded-xl bg-card border border-border dark:bg-gray-800 dark:border-gray-700 h-[600px] flex flex-col">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700 text-gray-800 dark:text-gray-100 flex-shrink-0">
        Live Tournament Log
      </h3>
      
      {/* Scrollable Log Container:
        - flex-grow allows it to fill the remaining vertical space.
        - overflow-y-auto enables scrolling.
        - Scrollbar classes (hidden in this example, but customizable with Tailwind plugins).
      */}
      <div 
        ref={scrollRef}
        className="space-y-4 flex-grow overflow-y-auto pr-2" // pr-2 adds internal padding to prevent text touching the scrollbar
      >
        {activities.map((activity, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-3 group"
          >
            {/* Pulsing Indicator */}
            <div className={`relative flex h-3 w-3 ${activity.color} mt-1 flex-shrink-0`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activity.color} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${activity.color}`}></span>
            </div>
            
            {/* Animated Text Block */}
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className={`font-medium mr-1 ${activity.color} flex-shrink-0`}>
                <activity.icon className="inline h-4 w-4 mr-1 opacity-70" />
              </span>
              {/* Animation uses global keyframes (as established in previous fix) */}
              <span 
                  className="inline-block" 
                  style={{ animation: `fadeInText 0.5s ease-out forwards`, animationDelay: `${index * 0.15}s` }}
              >
                {activity.text}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedStatusPanel;