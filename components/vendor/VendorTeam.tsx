"use client";

import Image from "next/image";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorTeamMember } from "@/types/vendor-profile";

type VendorTeamProps = {
  team: VendorTeamMember[];
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export default function VendorTeam({ team }: VendorTeamProps) {
  const { dictionary } = useLanguage();
  const labels = dictionary.vendorPublic.team;

  const formatResponseTime = (hours: number | null): string | null => {
    if (!hours) return null;
    if (hours <= 24) return labels.respondsWithin24;
    return fill(labels.respondsWithin, { hours });
  };

  if (!team.length) {
    return <p className="text-muted mb-0">{labels.empty}</p>;
  }

  return (
    <div>
      <h2 className="h3 mb-4">{labels.heading}</h2>
      <div className="row g-4">
        {team.map((member) => {
          const responseText = formatResponseTime(member.respondsWithinHours);
          return (
            <div className="col-12 col-md-6 col-lg-4" key={member.id}>
              <div className="card h-100 shadow-sm">
                {member.headshotUrl ? (
                  <div className="position-relative" style={{ height: "220px" }}>
                    <Image
                      src={resolveMediaUrl(member.headshotUrl)}
                      alt={member.name}
                      fill
                      unoptimized={shouldRenderUnoptimizedMedia(member.headshotUrl)}
                      className="object-fit-cover rounded-top"
                    />
                  </div>
                ) : null}
                <div className="card-body">
                  <h3 className="card-title h5 mb-1">{member.name}</h3>
                  {member.title ? <p className="text-muted mb-2">{member.title}</p> : null}
                  {member.bio ? <p className="card-text">{member.bio}</p> : null}
                </div>
                {responseText ? <div className="card-footer text-success small">{responseText}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
