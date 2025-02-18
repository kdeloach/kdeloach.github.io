import React, { useState, useEffect } from "react";

import { MapContainer, TileLayer, GeoJSON, FeatureGroup, useMap, LayersControl, ZoomControl } from "react-leaflet";
import wellknown from "wellknown";
import L from "leaflet";
import "leaflet-fullscreen";
import { EditControl } from "react-leaflet-draw";

import "leaflet/dist/leaflet.css";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import "leaflet-draw/dist/leaflet.draw.css";

import { PHILADELPHIA } from "./philadelphia";

const pastelColors = ["#7F3C8D", "#12A579", "#396AAC", "#F2B701", "#E73F73", "#80BA5A", "#E6830F", "#008695", "#CE1C90", "#4B4B8F"];

let _colorIndex = 0;
function getRandomColor() {
    return pastelColors[_colorIndex++ % pastelColors.length];
}

let _uniqueID = 0;
function uniqueID() {
    _uniqueID++;
    return _uniqueID;
}

// WKTIterator parses strings in the format "WORD\(...\)*" into a list of
// strings, skipping whitespace and invalid characters between terms, to
// support parsing WKTs copy & pasted from pgAdmin. It does not handle
// validating or parsing WKT strings.
class WKTIterator {
    text: string;
    i: number;

    public constructor(text: string) {
        this.text = text;
        this.i = 0;
    }

    parseWKT(): string {
        this.skipInvalidChars();
        if (!this.hasNext()) {
            return "";
        }

        const start = this.i;

        this.parseWord();

        this.skipWhitespace();

        if (this.isChar()) {
            this.parseEmpty();
        } else {
            this.parseParens();
        }

        return this.text.slice(start, this.i);
    }

    parseWord(): string {
        let word = "";
        if (!this.isChar()) {
            throw new Error(`Parse error: expected character at index ${this.i} but got ${this.current()}`);
        }
        while (this.isChar()) {
            word += this.consume();
        }
        return word;
    }

    parseParens() {
        let openParens = 1;

        this.consume("(");

        while (openParens > 0 && this.hasNext()) {
            switch (this.current()) {
                case "(":
                    openParens++;
                    break;
                case ")":
                    openParens--;
                    break;
            }
            if (openParens < 0) {
                throw new Error(`Parse error: parenthesis mismatch`);
            }
            this.consume();
        }

        if (openParens > 0) {
            throw new Error(`Parse error: unclosed parenthesis`);
        }
    }

    parseEmpty() {
        const word = this.parseWord();
        if (word.toUpperCase() !== "EMPTY") {
            throw new Error(`Parse error: expected EMPTY but got ${word}`);
        }
    }

    isChar(): boolean {
        if (this.hasNext()) {
            const n = this.current().charCodeAt(0);
            return (n >= 65 && n <= 90) || (n >= 97 && n <= 122); // A-Z or a-z
        }
        return false;
    }

    isDigit(): boolean {
        if (this.hasNext()) {
            const c = this.current();
            const n = c.charCodeAt(0);
            return (n >= 48 && n <= 57) || c === "-" || c === "."; // 0-9 or - or .
        }
        return false;
    }

    isValid(): boolean {
        return this.isChar() || this.isDigit();
    }

    skipInvalidChars() {
        while (this.hasNext() && !this.isValid()) {
            this.consume();
        }
    }

    isWhitespace(): boolean {
        const c = this.current();
        return c === " " || c === "\n";
    }

    skipWhitespace() {
        while (this.hasNext() && this.isWhitespace()) {
            this.consume();
        }
    }

    current(): string {
        return this.text[this.i];
    }

    consume(expected?: string): string {
        const c = this.current();
        if (expected && expected !== c) {
            throw new Error(`Parse error: expected ${expected} at index ${this.i} but got ${c}`);
        }
        this.i++;
        return c;
    }

    hasNext(): boolean {
        return this.i < this.text.length;
    }
}

function parseWKTStrings(text: string): string[] {
    const result: string[] = [];
    const iter = new WKTIterator(text);

    while (iter.hasNext()) {
        const wkt = iter.parseWKT();
        if (wkt) {
            result.push(wkt);
        }
    }

    return result;
}

export function WKTViewer() {
    const [wkt, setWkt] = useState("");
    const [geoJson, setGeoJson] = useState(null);
    const [error, setError] = useState("");

    const handleWktChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        setWkt(input);
        setError("");
    };

    const loadExample = () => {
        setWkt(PHILADELPHIA);
    };

    // Fired whenever a shape is created (e.g., a polygon is finished)
    const onCreated = (e: any) => {
        const { layerType, layer } = e;

        if (layerType === "polygon") {
            const latLngs = layer.getLatLngs()[0];
            const coords = latLngs.map((latLng: any) => [latLng.lng, latLng.lat]);

            // Ensure polygon is closed for WKT
            if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
                coords.push(coords[0]);
            }

            const polygonGeoJSON: any = {
                type: "Polygon",
                coordinates: [coords],
            };

            try {
                const wktString = wellknown.stringify(polygonGeoJSON);
                setWkt(`${wkt}\n${wktString}`);
            } catch (ex) {
                console.error(ex);
            }

            layer.remove();
        }
    };

    useEffect(() => {
        const features: any = [];

        let wktStrings: string[] = [];
        try {
            wktStrings = parseWKTStrings(wkt);
        } catch (ex) {
            console.error(ex);
            setError(ex.message);
        }

        for (const wkt of wktStrings) {
            try {
                const geometry = wellknown.parse(wkt);
                if (geometry) {
                    features.push({
                        type: "Feature",
                        properties: { key: uniqueID(), color: getRandomColor() },
                        geometry,
                    });
                }
            } catch (ex) {
                console.error(ex);
                setError(ex.message);
            }
        }

        if (features.length > 0) {
            setGeoJson({
                type: "FeatureCollection",
                features,
            });
        } else {
            setGeoJson(null);
        }
    }, [wkt]);

    return (
        <>
            <div style={{ height: 400 }}>
                <MapContainer center={[38, -96]} zoom={4} zoomControl={false} attributionControl={false} style={{ height: "100%" }}>
                    <WKTMap geoJson={geoJson} onCreated={onCreated} />
                </MapContainer>
            </div>
            <h3>Enter WKT Geometry:</h3>
            <textarea rows={10} style={{ width: "100%", boxSizing: "border-box" }} placeholder="e.g. POLYGON((-90 40, -90 50, -80 50, -80 40, -90 40))" value={wkt} onChange={handleWktChange} />
            <p style={{ color: "red" }}>{error}</p>
            <button onClick={(e) => loadExample()}>Load Example</button>
        </>
    );
}

interface WKTMapProps {
    geoJson: any;
    onCreated: (e: any) => void;
}

function WKTMap({ geoJson, onCreated }: WKTMapProps) {
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
            <TileLayer attribution={'&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={24} />
            {geoJson && (
                <LayersControl position="topright">
                    {geoJson.features.map((feature: any, index: number) => {
                        const singleFeature: any = {
                            type: "FeatureCollection",
                            features: [feature],
                        };
                        return (
                            <LayersControl.Overlay key={feature.properties.key} checked name={`WKT Shape ${index + 1}`}>
                                <GeoJSON
                                    data={singleFeature}
                                    style={() => ({
                                        color: feature.properties.color,
                                        weight: 3,
                                    })}
                                />
                            </LayersControl.Overlay>
                        );
                    })}
                </LayersControl>
            )}
            <FeatureGroup>
                <EditControl
                    position="topright"
                    onCreated={onCreated}
                    draw={{
                        polygon: true,
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                    }}
                />
            </FeatureGroup>
        </>
    );
}
