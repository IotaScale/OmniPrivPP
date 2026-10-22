import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Calendar, Users, Clock, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  await requireAdminSession();

  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { starts_at: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Calendar className="h-6 w-6 text-cyan-400" />
          <span>Events, Webinars & Labs Schedule</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Schedule partner briefings, monitor attendee registrations, and configure technical hands-on lab sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="info" size="sm">
                  {ev.event_type.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(ev.starts_at).toLocaleDateString()} {new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{ev.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ev.description}</p>
            </div>

            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{ev.duration_minutes} Mins &bull; {ev.product_area}</span>
              </div>
              <div className="font-mono font-semibold text-cyan-400">
                {ev._count.registrations} Partner Registrations
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
