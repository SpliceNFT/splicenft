import { Button } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React, { useState } from 'react';
import { DominantColors } from '../molecules/DominantColors';
import { P5Sketch } from '../molecules/P5Sketch';

export const CreativePanel = ({
  imgUrl,
  onCreated
}: {
  imgUrl: string;
  onCreated: (bytes: Blob) => void;
}) => {
  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  const [p5Canvas, setP5Canvas] = useState<p5Types>();
  const [saved, setSaved] = useState<boolean>(false);
  const save = async () => {
    //todo this is very likely not the best idea, but... it sort of works
    const canvas = (p5Canvas as any).canvas as HTMLCanvasElement;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSaved(true);
        onCreated(blob);
      },
      'image/png',
      100
    ); //.toDataURL('image/png');
  };

  return (
    <>
      {imgUrl && (
        <DominantColors
          imgUrl={imgUrl}
          dominantColors={dominantColors}
          setDominantColors={setDominantColors}
        />
      )}
      {dominantColors.length > 0 && (
        <P5Sketch
          dim={{ w: 400, h: 400 }}
          colors={dominantColors}
          onCanvasCreated={setP5Canvas}
        />
      )}

      {p5Canvas && !saved && (
        <Button onClick={save} variant="black">
          save
        </Button>
      )}
    </>
  );
};
