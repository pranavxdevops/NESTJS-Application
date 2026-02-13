'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SuggestedEventsCardProps {
  locale: string;
}

export default function SuggestedEventsCard({ locale }: SuggestedEventsCardProps) {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    setEvents([
      {
        id: '1',
        title: '11th World FZO World Congress',
        date: '10-12 Oct, 2025',
        organizer: 'World Free Zones Organization',
        location: 'Hainan, China',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=800',
      },
    ]);
  }, []);

  return (
    <div className="flex p-8 flex-col gap-6 rounded-[20px] border border-wfzo-gold-200 bg-[#F8F5F1]">
      <div className="flex flex-col gap-4">
        <h3 className="text-wfzo-grey-900 font-source text-xl font-normal leading-6">
          Suggested Events
        </h3>

        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id} className="flex flex-col gap-3">
              <div className="flex gap-4">
                <div className="w-[60px] h-[60px] rounded-xl bg-gray-200 relative overflow-hidden flex-shrink-0">
                  {event.image && (
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <h4 className="text-wfzo-grey-800 font-source text-base font-bold leading-5">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    <span className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                      {event.date}
                    </span>
                  </div>
                  <p className="text-wfzo-grey-800 font-source text-xs font-bold leading-4">
                    {event.organizer}
                  </p>
                  <span className="text-wfzo-grey-700 font-source text-sm font-normal leading-5">
                    {event.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(`/${locale}/events/all-events`)}
          className="self-start px-6 py-2 rounded-xl bg-wfzo-gold-50 text-wfzo-gold-600 font-source text-base font-semibold leading-6 hover:bg-wfzo-gold-100 transition-colors cursor-pointer"
        >
          View all
        </button>
      </div>
    </div>
  );
}
// 'use client';

// import { useRouter } from 'next/navigation';
// import { useState, useEffect } from 'react';
// import Image from 'next/image';

// interface SuggestedEventsCardProps {
//   locale: string;
//   event?: any;
// }

// export default function SuggestedEventsCard({ locale, event }: SuggestedEventsCardProps) {
//   const router = useRouter();
//   const events = event ? [event] : [];

//   return (
//     <div className="flex p-8 flex-col gap-6 rounded-[20px] border border-wfzo-gold-200 bg-[#FCFAF8]">
//       <div className="flex flex-col gap-4">
//         <h3 className="text-wfzo-grey-900 font-source text-xl font-normal leading-6">
//           Suggested Events
//         </h3>

//         <div className="flex flex-col gap-4">
//           {events.map((event) => (
//             <div key={event.id} className="flex flex-col gap-3">
//               <div className="flex gap-4">
//                 <div className="w-[60px] h-[60px] rounded-xl bg-gray-200 relative overflow-hidden flex-shrink-0">
//                   {event.image && (
//                     <Image
//                       src={event.image}
//                       alt={event.title}
//                       fill
//                       className="object-cover"
//                     />
//                   )}
//                 </div>

//                 <div className="flex-1 flex flex-col gap-1">
//                   <h4 className="text-wfzo-grey-800 font-source text-base font-bold leading-5">
//                     {event.title}
//                   </h4>
//                   <div className="flex items-center gap-1">
//                     <span className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
//                       {event.date}
//                     </span>
//                   </div>
//                   <p className="text-wfzo-grey-800 font-source text-xs font-bold leading-4">
//                     {event.organizer}
//                   </p>
//                   <span className="text-wfzo-grey-700 font-source text-sm font-normal leading-5">
//                     {event.location}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <button
//           onClick={() => router.push(`/${locale}/events/suggested`)}
//           className="px-6 py-2 rounded-xl bg-wfzo-gold-50 text-wfzo-gold-600 font-source text-base font-semibold leading-6 hover:bg-wfzo-gold-100 transition-colors"
//         >
//           View all
//         </button>
//       </div>
//     </div>
//   );
// }
