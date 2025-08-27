"use client";

import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useModalStore } from "@/store/modalStore";
import popupStyles from "@/styles/MapPopup.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

async function updateUserLocation(latitude: number, longitude: number) {
  try {
    const result = await userApi.updateLocation(latitude, longitude);
    if (result.error) {
      console.error("Location update API error:", result.error);
      return;
    }
    console.log(`[${new Date().toLocaleTimeString()}] 위치 정보 업데이트 성공`);
  } catch (error) {
    console.error("위치 정보 업데이트 실패:", error);
  }
}

function MapContainer() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const { show: showAlert } = useModalStore();

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setInitialCenter([longitude, latitude]);
        updateUserLocation(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        showAlert(
          "위치 정보를 가져오는 데 실패했습니다. 기본 위치(서울)로 지도를 표시합니다."
        );
        setInitialCenter([127.0, 37.5]);
      }
    );
  }, []);

  useEffect(() => {
    if (!initialCenter || map.current || !mapContainer.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: initialCenter,
      zoom: 15,
    });

    const currentMap = map.current;
    let watchId: number | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const haversine = (a: [number, number], b: [number, number]) => {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371_000; // meters
      const dLat = toRad(b[1] - a[1]);
      const dLon = toRad(b[0] - a[0]);
      const lat1 = toRad(a[1]);
      const lat2 = toRad(b[1]);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const h =
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      return R * c;
    };

    const computeViewportRadius = () => {
      const current = map.current;
      if (!current) return 1000;
      const bounds = current.getBounds();
      const sw = bounds!.getSouthWest();
      const ne = bounds!.getNorthEast();
      const diagonal = haversine([sw.lng, sw.lat], [ne.lng, ne.lat]);
      const radius = Math.max(500, Math.min(5_000, Math.floor(diagonal / 2)));
      return radius;
    };

    currentMap.on("load", async () => {
      const myMarker = new mapboxgl.Marker({ color: "red" })
        .setLngLat(initialCenter)
        .addTo(currentMap);

      let latestPosition = {
        latitude: initialCenter[1],
        longitude: initialCenter[0],
      };

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          latestPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          myMarker.setLngLat([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => console.error("Watch Error:", err),
        { enableHighAccuracy: true }
      );

      intervalId = setInterval(() => {
        updateUserLocation(latestPosition.latitude, latestPosition.longitude);
      }, 300000); // 300s

      const markers: mapboxgl.Marker[] = [];
      const renderNearby = async () => {
        try {
          const res = await userApi.findNearby(computeViewportRadius());
          for (const m of markers.splice(0, markers.length)) m.remove();

          if (res.data && res.data.length > 0) {
            res.data.forEach((u) => {
              if (u.longitude != null && u.latitude != null) {
                const normalizeRadius = (d: number): number => {
                  const options = [500, 1000, 3000, 5000];
                  for (const v of options) if (d <= v) return v;
                  return options[options.length - 1];
                };
                const distNum =
                  typeof u.distance === "number"
                    ? u.distance
                    : Number.parseFloat(String(u.distance));
                const targetRadius = Number.isFinite(distNum)
                  ? normalizeRadius(distNum)
                  : 1000;

                const html = `
                  <div class="${popupStyles.popup}">
                    <h4 class="${popupStyles.title}">${
                  u.username ?? "무명"
                }</h4>
                    <div class="${
                      popupStyles.hobbies
                    }" style="margin-bottom:6px;">
                      거리: ${
                        Number.isFinite(distNum) ? distNum.toFixed(0) : "-"
                      }m
                    </div>
                    <div class="${popupStyles.hobbies}"> ${u.hobbies
                  .map((h) => h)
                  .join(", ")}</div>
                    <div class="${popupStyles.actions}">
                      <a class="${popupStyles.ctaBtn}" href="/matches?pin=${
                  u.id
                }&radius=${targetRadius}"><span class="${
                  popupStyles.icon
                }">🔎</span><span>매칭</span></a>
                    </div>
                  </div>
                `;

                const popup = new mapboxgl.Popup({
                  offset: 24,
                  closeButton: true,
                  className: "wa-popup",
                  maxWidth: "280px",
                })
                  .setHTML(html)
                  .setMaxWidth("280px");

                popup.on("open", () => {
                  const el = popup.getElement();
                  if (el) {
                    (el as HTMLElement).style.maxWidth = "280px";
                  }
                });

                const marker = new mapboxgl.Marker()
                  .setLngLat([u.longitude, u.latitude])
                  .setPopup(popup)
                  .addTo(currentMap);
                markers.push(marker);
              }
            });
          }
        } catch (e) {
          console.error("근처 사용자 로딩 실패", e);
        }
      };

      await renderNearby();
      const nearbyInterval = setInterval(renderNearby, 60_000);

      const onMoveEnd = () => void renderNearby();
      const onZoomEnd = () => void renderNearby();
      currentMap.on("moveend", onMoveEnd);
      currentMap.on("zoomend", onZoomEnd);

      currentMap.once("remove", () => {
        clearInterval(nearbyInterval);
        currentMap.off("moveend", onMoveEnd);
        currentMap.off("zoomend", onZoomEnd);
      });
    });

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (intervalId !== null) clearInterval(intervalId);
      if (currentMap) {
        currentMap.remove();
      }
      map.current = null;
    };
  }, [initialCenter]);

  if (!initialCenter) {
    return <div>🗺️지도를 불러오고 있습니다...</div>;
  }

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}

export default function MapView() {
  const { initialize } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    initialize();
    setIsClient(true);
  }, [initialize]);

  if (!isClient) {
    return <div>🗺️지도를 불러오고 있습니다...</div>;
  }

  return <MapContainer />;
}
