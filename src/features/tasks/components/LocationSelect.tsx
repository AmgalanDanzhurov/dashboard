"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encodeLocation } from "@/lib/domain/location";
import type { Area, Project } from "@/lib/domain/types";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  areas: readonly Area[];
  /** Только активные проекты, плюс текущий, даже если он в архиве. */
  projects: readonly Project[];
};

/** Где лежит задача: «Входящие», раздел или проект внутри раздела. */
export function LocationSelect({
  id,
  value,
  onChange,
  areas,
  projects,
}: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={encodeLocation({ kind: "inbox" })}>
          Входящие
        </SelectItem>
        {areas.map((area) => (
          <SelectGroup key={area.id}>
            <SelectLabel>{area.name}</SelectLabel>
            <SelectItem
              value={encodeLocation({ kind: "area", areaId: area.id })}
            >
              <Dot color={area.color} />
              {area.name} — без проекта
            </SelectItem>
            {projects
              .filter((p) => p.area_id === area.id)
              .map((project) => (
                <SelectItem
                  key={project.id}
                  value={encodeLocation({
                    kind: "project",
                    projectId: project.id,
                  })}
                >
                  <Dot color={project.color} />
                  {project.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-2.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
