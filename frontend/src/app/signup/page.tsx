'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, gql } from '@apollo/client';

const Field = (props: { className?: string; label: string; children: any; error: string }) => {
	return (
		<div className={props.className}>
			<div>{props.label}</div>
			{props.children}
			<div className='text-1xl text-red-600'>{props.error}</div>
		</div>
	);
};

const SIGN_UP = gql`
	mutation SignUp($email: String!, $password: String!) {
		signup(email: $email, password: $password) {
			auth_key
		}
	}
`;
const AUTHENTICATE = gql`
	query Authenticate($authKey: String) {
		authenticate(authKey: $authKey) {
			auth_key
			email
		}
	}
`;

export default function Signup() {
	const [state, _setState] = useState({
		email: { content: '', error: '' },
		password: { content: '', error: '' },
		timeouts: [],
	});
	let _state: any = useRef(state);
	const setState = (data: any) => {
		_state.current = data;
		_setState(data);
	};

	const router = useRouter();

	const getAuth = () => {
		let auth = '';
		try {
			auth = localStorage.getItem('authKey') || '';
		} catch (error) {
			return auth;
		}
	};

	// Force back to /dashboard if already logged in
	useQuery(AUTHENTICATE, {
		variables: {
			authKey: getAuth(),
		},
		onCompleted: (data) => {
			if (data.authenticate != null) {
				router.push('/dashboard');
				return;
			}
		},
	});

	const [signUp, { data, loading, error }] = useMutation(SIGN_UP, {
		onCompleted: (data) => {
			if (data == null || data.signup == null) return createError(['email'], 'An error has occurred');

			let authKey = data.signup.auth_key;

			localStorage.setItem('authKey', authKey);

			router.push('/dashboard');
		},
		onError: (error) => {
			createError(['email'], error.toString());
		},
	});

	const createError = (keys: string[], error: string) => {
		state.timeouts.map((timeout) => clearTimeout(timeout));

		let stateClone: any = Object.assign({}, state);
		console.log(stateClone);
		console.log(keys);
		for (let key of keys) {
			stateClone[key].error = error;
			stateClone.timeouts.push(
				setTimeout(() => {
					setState({
						..._state.current,
						[key]: {
							..._state.current[key],
							error: '',
						},
					});
				}, 4000)
			);
		}

		setState(stateClone);
	};

	const onSubmit = () => {
		let { email, password } = state;

		signUp({
			variables: { email: email.content, password: password.content },
		});
	};

	return (
		<div className='w-full flex h-full justify-center items-center flex-col pb-[80px]'>
			<div className='py-3 bg-gray-200 w-[400px] h-min rounded shadow-md font-sans flex flex-col items-center'>
				<div className='text-black text-4xl w-full flex justify-center items-center text-center py-2 mb-1'>Sign up</div>

				{/* Fields */}
				<div className='w-full px-4 py-4 text-2xl'>
					<Field label='Email' className='mb-2' error={state.email.error}>
						<input
							type='email'
							className='w-full bg-whit p-1'
							onChange={(event: any) => setState({ ...state, email: { ...state.email, content: event.target.value } })}
							value={state.email.content}
						/>
					</Field>
					<Field label='Password' error={state.password.error}>
						<input
							type='password'
							className='w-full p-1'
							onChange={(event: any) => setState({ ...state, password: { ...state.password, content: event.target.value } })}
							value={state.password.content}
						/>
					</Field>
					<button className='rounded p-4 py-2 mt-[30px] w-full outline-none border-none bg-gray-500 text-white font-sans transition-all hover:bg-red-900 hover:text-black' onClick={onSubmit}>
						{loading ? '...' : 'Submit'}
					</button>
				</div>
			</div>
		</div>
	);
}
