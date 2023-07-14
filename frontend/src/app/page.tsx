'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
	const router = useRouter();

	const button = 'rounded p-4 py-2 w-[250px] mb-[5px] text-[50px] outline-none border-none bg-gray-500 text-white font-sans transition-all hover:bg-red-900 hover:text-black';

	return (
		<div className='w-full flex h-full justify-center items-center flex-col pb-[80px]'>
			<button className={button} onClick={() => router.push('/login')}>
				Log in
			</button>
			<button className={button} onClick={() => router.push('/signup')}>
				Sign up
			</button>
		</div>
	);
}
