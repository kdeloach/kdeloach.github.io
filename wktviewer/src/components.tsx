import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl, ZoomControl } from "react-leaflet";
import wellknown from "wellknown";
import L from "leaflet";
import "leaflet-fullscreen";

import "leaflet/dist/leaflet.css";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";

export function WKTViewer() {
    const [wkt, setWkt] = useState("");
    const [geoJson, setGeoJson] = useState(null);

    // Handle WKT input changes
    const handleWktChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        setWkt(input);

        const features: any = [];

        // 1. Strip surrounding quotes (optional) and trim whitespace
        let text = input.trim().replace(/^['"]+|['"]+$/g, "");

        // 2. Convert all newlines/tabs/multiple spaces to a single space
        text = text.replace(/\s+/g, " ");

        // 3. Use a regex to capture multiple WKT shapes in one string (supports multiline WKT)
        const wktRegex = /\b(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)\s*\([^()]*\([^()]*\)[^()]*\)|\b(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)\s*\([^)]*\)/gi;
        const matches = text.match(wktRegex);

        // 4. Parse each matched WKT string into GeoJSON
        if (matches) {
            for (const match of matches) {
                try {
                    const geometry = wellknown.parse(match);
                    if (geometry) {
                        features.push({
                            type: "Feature",
                            properties: {},
                            geometry,
                        });
                    }
                } catch (error) {
                    console.error(`Invalid WKT: ${match}`, error);
                }
            }
        }

        // 5. Update state with a FeatureCollection if any features exist
        if (features.length > 0) {
            setGeoJson({
                type: "FeatureCollection",
                features,
            });
        } else {
            setGeoJson(null);
        }
    };

    return (
        <>
            <div style={{ height: 400 }}>
                <MapContainer center={[38, -96]} zoom={4} zoomControl={false} attributionControl={false} style={{ height: "100%" }}>
                    <WKTMap geoJson={geoJson} />
                </MapContainer>
            </div>
            <h3>Enter WKT Geometry:</h3>
            <textarea rows={10} style={{ width: "100%", boxSizing: "border-box" }} placeholder="e.g. POLYGON((-90 40, -90 50, -80 50, -80 40, -90 40))" value={wkt} onChange={handleWktChange} />
        </>
    );
}

interface WKTMapProps {
    geoJson: any;
}

function WKTMap({ geoJson }: WKTMapProps) {
    const map = useMap();

    useEffect(() => {
        if (!map || !geoJson) return;

        const layer = L.geoJSON(geoJson);
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }, [map, geoJson]);

    useEffect(() => {
        if (map) {
            const attrControl = new L.Control.Attribution();
            attrControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
            map.addControl(attrControl);

            map.addControl(new L.Control.Zoom({ position: "bottomright" }));

            // @ts-ignore: Fixes TS2339: Property 'Fullscreen' does not exist on type 'typeof Control'.
            map.addControl(new L.Control.Fullscreen({ position: "bottomright" }));
        }
    }, [map]);

    return (
        <>
            <TileLayer attribution={'&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {geoJson && (
                <LayersControl position="topright">
                    {geoJson.features.map((feature: any, index: number) => {
                        const singleFeature: any = {
                            type: "FeatureCollection",
                            features: [feature],
                        };
                        return (
                            <LayersControl.Overlay key={index} checked name={`WKT Shape ${index + 1}`}>
                                <GeoJSON data={singleFeature} />
                            </LayersControl.Overlay>
                        );
                    })}
                </LayersControl>
            )}
        </>
    );
}
