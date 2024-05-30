'use client'

import { ChangeEventHandler, FormEvent, useRef, useState } from 'react';

const getImageData = (image: Blob) => {
  const fr = new FileReader();

  return new Promise<HTMLImageElement>((resolve, reject) => {
    fr.onload = () => {
      if (!fr.result) {
        reject(new Error("Failed to load image"));
        return;
      }

      const img = document.createElement("img");
      img.onload = () => {
        resolve(img);
      };
      img.src = fr.result.toString();
    };
    fr.readAsDataURL(image);
  });
}

const splitPageInTwo = (page: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  canvas.width = page.width / 2;
  canvas.height = page.height;

  ctx.drawImage(page, 0, 0, page.width / 2, page.height, 0, 0, page.width / 2, page.height);
  const page1 = canvas.toDataURL();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(page, page.width / 2, 0, page.width / 2, page.height, 0, 0, page.width / 2, page.height);
  const page2 = canvas.toDataURL();

  return [page1, page2];
  
}


export default function Home() {
  const [files, setFiles] = useState<{file: File, split:boolean}[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const downloadPages = async (pages: {name: string, page:string}[]) => {
    const a = document.createElement("a");
    pages.forEach((page, i) => {
      a.href = page.page;
      a.download = page.name;
      a.click();
    })
  }

  const splitPages = async () => {
    if (!files) return;

    const pagesPromises = Array.from(files).map(async ({file, split}) => {
      if (!split) return {name: file.name, page: URL.createObjectURL(file)};

      const image = await getImageData(file as Blob);
      const [name, ext]= file.name.split(/(?=\.[^.]+$)/);
      return splitPageInTwo(image)?.map((page, i) => ({name:`${name}-${i+1}${ext}`, page}));
    })

    const pages = (await Promise.all(pagesPromises)).flat().filter((page): page is {name: string, page:string} => !!page);

    downloadPages(pages);
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    e.preventDefault();
    const files =  e.target.files;

    if (!files) return;

    setFiles(Array.from(files).map(file => ({file, split: true})));
  }

  const toggleShouldSplit = (name: string) => {
    setFiles(files.map(({file, split}) => ({file, split: file.name === name ? !split : split})));
  }

  return (
    <>
      <input type="file" name="images" multiple onChange={handleChange} ref={inputRef} className='hidden' />
      <div className='flex flex-col items-center mt-20 gap-2'>
        <h1 className='text-5xl'>Le Crop-Inator</h1>
        <h2 className='text-lg'>Split manga pages</h2>
      </div>
      <div className='flex gap-4 mt-8 mx-auto w-full max-w-96'>
      <a
        className='block w-1/2 mx-auto py-2 px-4 bg-blue-500 text-white rounded-lg text-center cursor-pointer'
        onClick={(e) => {
          e.preventDefault();

          if (inputRef.current) inputRef.current.click();
        }}
      >
        Upload Files
      </a>
      <button
        className='block w-1/2 mx-auto py-2 px-4 bg-blue-500 text-white rounded-lg text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-500'
        onClick={(e) => {
          e.preventDefault();

          splitPages()
        }}
        disabled={files.length === 0}
        type='button'
      >
        Split Pages
      </button>
      </div>
      {files.length > 0 && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4'>
            {files.map(({file, split}) => (
              <button key={file.name} onClick={() => toggleShouldSplit(file.name)} className={`rounded-lg overflow-hidden border-4 ${split ? 'border-blue-500' : 'border-transparent'}`}>
                <img src={URL.createObjectURL(file)} alt={file.name} />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
