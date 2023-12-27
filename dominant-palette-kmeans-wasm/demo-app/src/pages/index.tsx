import { Color, get_dominant_colors } from 'dominant-palette-kmeans';
import { ChangeEvent, useCallback, useState } from 'react';

export default function Home() {

  const [imageData, setImageData] = useState<{bytes: Uint8Array, preview: string}>();
  const [palette, setPalette] = useState<Color[]>();

  const onSelected = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0]
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event?.target?.result) return;
      const blob = new Blob([event.target.result], { type: selectedFile.type });
      setImageData({
        bytes: new Uint8Array(event.target.result as ArrayBufferLike), 
        preview: URL.createObjectURL(blob)
      });
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const extractColors = useCallback(() => {
    if (!imageData) return;  
    const palette = get_dominant_colors(imageData.bytes, 2, 10, 20).then(setPalette)
  }, [imageData, setPalette])

  return (
    <main>
      <input type="file" id="file" name="file" onChange={onSelected}/>
      <button onClick={extractColors}>extract dominant colors</button>
      <p>
      {palette && palette.map((c, i) => {
        return <span key={`c-${i}`} style={{
          display: "inline-block", 
          height: "40px",
          width:`${c.freq * 800}px`, 
          background: c.hex
        }}>
        </span>
      }
      )}
      </p>
      { imageData && <img src={imageData.preview} alt="preview" width="400px" />  }
    </main>
  )
}