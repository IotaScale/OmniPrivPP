import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { registerForEventAction } from '@/lib/actions/events';
import { Calendar, Clock, Video, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerEventsPage() {
  const session = await requirePartnerSession();

  const [events, userRegistrations] = await Promise.all([
    prisma.event.findMany({
      where: { is_published: true },
      orderBy: { starts_at: 'asc' },
    }),
    prisma.eventRegistration.findMany({
      where: { user_id: session.userId },
    }),
  ]);

  const registeredEventIds = new Set(userRegistrations.map((r) => r.event_id));

  const typeLabelMap: Record<string, string> = {
    webinar: 'Webinar',
    technical_workshop: 'Hands-on Lab',
    partner_briefing: 'Executive Briefing',
    summit: 'Partner Summit',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-cyan-400" />
            <span>Events, Briefings & Technical Labs</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Join live executive roadmap briefings, architecture masterclasses, and hands-on zero-trust deployment labs.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <Calendar className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No scheduled events at this time</h3>
          <p className="text-xs text-slate-500">Upcoming briefings and technical workshops will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const isRegistered = registeredEventIds.has(ev.id);
            const isPast = new Date(ev.starts_at) < new Date();

            return (
              <div
                key={ev.id}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={ev.event_type === 'technical_workshop' ? 'warning' : 'info'} size="sm">
                      {typeLabelMap[ev.event_type] || ev.event_type}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ev.starts_at).toLocaleDateString()} &bull; {new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {ev.timezone}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{ev.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ev.description}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{ev.duration_minutes} Mins</span>
                    <span>&bull;</span>
                    <span className="text-slate-300">{ev.product_area}</span>
                  </div>

                  {isRegistered ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Registered</span>
                      </span>
                      {ev.meeting_link && (
                        <a href={ev.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-400">
                            <span>Join</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ) : (
                    <form action={registerForEventAction}>
                      <input type="hidden" name="eventId" value={ev.id} />
                      <Button type="submit" variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        <span>Reserve Seat</span>
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
