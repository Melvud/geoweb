"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Search, X } from "lucide-react";

export type FeaturedOption = {
  id: string;
  title: string;
  meta: string;
  imagePath?: string | null;
};

export function HomepageFeaturedSelector({
  title,
  description,
  items,
  selected,
  onChange,
}: {
  title: string;
  description: string;
  items: FeaturedOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const chosen = selected.map((id) => itemMap.get(id)).filter((item): item is FeaturedOption => Boolean(item));
  const available = items.filter((item) => {
    if (selected.includes(item.id)) return false;
    return `${item.title} ${item.meta}`.toLowerCase().includes(query.trim().toLowerCase());
  });

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <section className="home-featured-selector">
      <div className="home-featured-selector-head">
        <div><h3>{title}</h3><p>{description}</p></div>
        <span>{chosen.length} выбрано</span>
      </div>

      <div className="home-featured-chosen">
        {chosen.map((item, index) => (
          <div key={item.id} className="home-featured-chosen-row">
            <span className="home-featured-order">{index + 1}</span>
            {item.imagePath ? <span className="home-featured-thumb" style={{ backgroundImage: `url(${item.imagePath})` }} /> : null}
            <span className="home-featured-copy"><strong>{item.title}</strong><small>{item.meta}</small></span>
            <span className="home-featured-move">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} title="Выше"><ArrowUp size={13} /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === chosen.length - 1} title="Ниже"><ArrowDown size={13} /></button>
              <button type="button" className="remove" onClick={() => onChange(selected.filter((id) => id !== item.id))} title="Убрать"><X size={13} /></button>
            </span>
          </div>
        ))}
        {chosen.length === 0 ? <div className="home-featured-empty">Ничего не выбрано — этот блок не появится на главной.</div> : null}
      </div>

      <div className="home-featured-add">
        <label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти материал…" /></label>
        <div className="home-featured-options">
          {available.slice(0, 12).map((item) => (
            <button key={item.id} type="button" onClick={() => onChange([...selected, item.id])}>
              {item.imagePath ? <span className="home-featured-thumb" style={{ backgroundImage: `url(${item.imagePath})` }} /> : <span className="home-featured-option-icon"><Plus size={13} /></span>}
              <span><strong>{item.title}</strong><small>{item.meta}</small></span>
              <Check size={14} />
            </button>
          ))}
          {available.length === 0 ? <div className="home-featured-no-results">Подходящих материалов нет.</div> : null}
        </div>
      </div>
    </section>
  );
}
