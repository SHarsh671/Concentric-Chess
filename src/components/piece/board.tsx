import { useEffect, useState } from "react";

//for SVG <path>'s
type Space = {
    id: string;
    d: string;
}

export default function Board() {

    const [spaces, setSpaces] = useState<Space[]>([]);

    //parse id and d
    useEffect(() => {
        fetch("/cc/ccboard.svg")
            .then(res => res.text())
            .then(svgText => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgText, "image/svg+xml");
                const pathNodes = Array.from(doc.querySelectorAll("path"));

                const extracted = pathNodes.map(node => ({
                    id: node.id || crypto.randomUUID(),
                    d: node.getAttribute("d") || "",
                }));

                setSpaces(extracted);
            });
    }, []);

    return (
        //SVG scales kinda weirdly over the board, so check it still looks okay when changing the sizing
        <svg viewBox="0 0 1710 1710" className="absolute top-[-10px] left-[-7px] pointer-events-none w-[1700px] h-[1700px]">
            {spaces.map(s => (
                <path
                    key={s.id}
                    d={s.d}
                    fill="transparent"
                    fillOpacity={0}
                    stroke="blue"
                    pointerEvents="auto"
                    onClick={() => console.log(s.id)}
                />
            ))}
        </svg>
    );
}