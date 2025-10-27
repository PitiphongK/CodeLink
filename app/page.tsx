'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from "@heroui/react";

export default function Home() {
  const [roomId, setRoomId] = useState('demo-room');
  const router = useRouter();

  return (
    <main>
      <div className="min-h-screen flex flex-col items-center py-8 px-4">
        <div className="mb-20">
          Code Link
        </div>
        <div className="flex flex-col md:flex-row items-start justify-start w-full max-w-4xl">
          <div className="flex flex-col items-start p-8 w-full md:w-1/2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Join a room</h2>
            <label htmlFor="roomCode" className="block text-gray-700 text-sm font-medium mb-5">
              Join an existing room and start coding!
            </label>
            <Input 
              placeholder="1234 5678" 
              type="text" 
              className='mb-4'
              classNames={{
              input: "p-2" 
            }}/>
            <Button color="primary">Enter</Button>
          </div>

          <div className="hidden md:block w-px bg-gray-300 h-64 mx-8"></div>
          <div className="block md:hidden w-full h-px bg-gray-300 my-8"></div>

          <div className="flex flex-col items-start p-8 w-full md:w-1/2">
          <h2 className="text-2xl font-semibold text-gray-800 mb-1">Create a room</h2>
          <label htmlFor="roomCode" className="block text-gray-700 text-sm font-medium mb-5">
            Start a new pair programming session and invite you collaborators!
          </label>
            <Button color="primary">Create</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
