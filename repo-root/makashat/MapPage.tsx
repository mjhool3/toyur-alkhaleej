import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type mapboxgl from "mapbox-gl"; // نوع فقط وقت الترجمة — لا يحمّل أي كود فعلي وقت التشغيل
import { COUNTRIES, Bird } from "../types";
import { getBird, listBirds } from "../lib/store";
import { useTheme } from "../contexts/ThemeContext";

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) || "";

export default function MapPage() {
  const [params] = useSearchParams();
  const birdId = params.get("bird");
  const { reduceMotion, palette } = useTheme();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxRef = useRef<typeof mapboxgl | null>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(birdId);

  useEffect(() => {
    listBirds().then(setBirds).catch(() => {});
  }, []);

  // تحميل مكتبة Mapbox (JS + CSS) ديناميكيًا — فقط عند وجود توكن حقيقي، وبأمان كامل
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ default: mapboxgl }] = await Promise.all([
          import("mapbox-gl"),
          import("mapbox-gl/dist/mapbox-gl.css"),
        ]);
        if (cancelled || !mapContainer.current) return;

        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [50.5, 25.5], // منتصف الخليج تقريبًا
          zoom: 4.3,
        });
        map.addControl(new mapboxgl.NavigationControl(), "top-left");
        map.on("load", () => !cancelled && setReady(true));
        map.on("error", () => !cancelled && setLoadFailed(true));
        mapRef.current = map;
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // نقاط الدول كعلامات ثابتة
  useEffect(() => {
    const mapboxgl = mapboxRef.current;
    if (!ready || !mapRef.current || !mapboxgl) return;
    COUNTRIES.forEach((c) => {
      new mapboxgl.Marker({ color: "#d4af37" })
        .setLngLat([c.lng, c.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(c.name_ar))
        .addTo(mapRef.current!);
    });
  }, [ready]);

  // رسم مسار الطائر المختار تدريجيًا
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!ready || !map || !mapboxgl || !selectedId) return;
    const bird = birds.find((b) => b.id === selectedId);
    if (!bird || bird.route.length < 2) return;

    const sourceId = "route-source";
    const layerId = "route-layer";
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    const coords = bird.route.map((p) => [p.lng, p.lat]);
    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } as any,
    });
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#d4af37", "line-width": 3 },
    });

    bird.route.forEach((p) => {
      new mapboxgl.Marker({ color: "#ffffff" }).setLngLat([p.lng, p.lat]).setPopup(new mapboxgl.Popup().setText(p.label)).addTo(map);
    });

    const bounds = (coords as any[]).reduce(
      (b: mapboxgl.LngLatBounds, c: number[]) => b.extend(c as [number, number]),
      new mapboxgl.LngLatBounds(coords[0] as any, coords[0] as any)
    );
    map.fitBounds(bounds, { padding: 60, duration: reduceMotion ? 0 : 800 });

    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    if (reduceMotion) {
      source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } as any);
      return;
    }
    let i = 1;
    const interval = setInterval(() => {
      source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords.slice(0, i + 1) } } as any);
      i++;
      if (i >= coords.length) clearInterval(interval);
    }, 350);
    return () => clearInterval(interval);
  }, [ready, selectedId, birds, reduceMotion]);

  return (
    <div className="pb-24 pt-6 space-y-4 page-enter" dir="rtl">
      <div className="px-4 space-y-1">
        <h1 className="font-display font-black text-2xl">خريطة الهجرة</h1>
        <p className="text-sm" style={{ color: palette.inkSecondary }}>اختر طائرًا لعرض مسار هجرته الحقيقي بين الدول</p>
      </div>

      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {birds
          .filter((b) => b.route.length >= 2)
          .map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className="press shrink-0 px-4 py-2 rounded-pill text-sm border"
              style={
                selectedId === b.id
                  ? { backgroundColor: palette.accent, color: "#000", borderColor: palette.accent, fontWeight: 600 }
                  : { backgroundColor: palette.surfaceCard, color: palette.inkSecondary, borderColor: "rgba(128,128,128,0.2)" }
              }
            >
              {b.name_ar}
            </button>
          ))}
      </div>

      {MAPBOX_TOKEN && !loadFailed ? (
        <div ref={mapContainer} className="mx-4 h-[60vh] rounded-card overflow-hidden border border-white/10" />
      ) : (
        <div className="mx-4 border border-white/10 rounded-card p-6 space-y-4" style={{ backgroundColor: palette.surfaceCard }}>
          <p className="text-sm leading-relaxed" style={{ color: palette.inkSecondary }}>
            {loadFailed
              ? "⚠️ تعذّر تحميل الخريطة (تحقق من اتصال الإنترنت أو صحة توكن Mapbox)."
              : (
                <>
                  ⚠️ الخريطة التفاعلية تحتاج مفتاح Mapbox (مجاني). أضِف{" "}
                  <code style={{ color: palette.accent }}>VITE_MAPBOX_TOKEN</code> في ملف <code style={{ color: palette.accent }}>.env</code>{" "}
                  (راجع README) ليظهر هنا خريطة حقيقية بها كل دول الخليج ومسارات الهجرة.
                </>
              )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {COUNTRIES.map((c) => (
              <div key={c.code} className="rounded-2xl p-3 text-center" style={{ backgroundColor: palette.surfaceRaised }}>
                <p className="text-sm font-semibold" style={{ color: palette.inkPrimary }}>{c.name_ar}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
