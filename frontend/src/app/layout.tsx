'use client';

import './globals.css';

import { useRouter } from 'next/navigation';
import { ApolloProvider } from '@apollo/client';
import client from '../../apollo-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const button =
		'rounded p-2 flex justify-center items-center mr-[5px] text-[24px] outline-none border-none bg-gray-500 text-white font-sans box-border transition-all hover:bg-gray-300 hover:text-black';

	return (
		<ApolloProvider client={client}>
			<html lang='en'>
				<body>
					<div className='fixed top-0 left-0 h-full w-full z-10'>
						<div className='bg-red-900 w-full h-min flex flex-row p-2 box-border'>
							<button className={button} onClick={() => router.push('/')}>
								Home
							</button>
							<button className={button} onClick={() => router.push('/login')}>
								Log in
							</button>
							<button className={button} onClick={() => router.push('/signup')}>
								Sign up
							</button>
							<button className={button} onClick={() => router.push('/dashboard')}>
								Dashboard
							</button>
						</div>
						{children}
					</div>
				</body>
			</html>
		</ApolloProvider>
	);
}
