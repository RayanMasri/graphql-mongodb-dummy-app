'use client';
import React, { useEffect, useState } from 'react';
// import { gql } from '@apollo/client';
import { useQuery, useLazyQuery, useMutation, gql } from '@apollo/client';
// import client from '../../../apollo-client';
import { BsPencilFill } from 'react-icons/bs';
import { GrFormClose } from 'react-icons/gr';
import { IoMdExit } from 'react-icons/io';
import { clsx } from 'clsx';

import { useRouter } from 'next/navigation';

const Note = (props: any) => {
	return (
		<div className='relative bg-gray-300 rounded w-[175px] h-[175px] p-[10px] flex flex-col'>
			<div className='h-min w-full flex justify-between items-center'>
				<div className='h-min text-2xl w-full truncate mr-1'>{props.title}</div>
				<div className='h-min w-min text-3xl left-full group transition-all ' onClick={props.onRemove}>
					<GrFormClose size='32' className='rounded-full hover:bg-gray-100 transition-all' />
				</div>
				<div className='h-min w-min text-3xl left-full group transition-all' onClick={props.onEdit}>
					<div className='rounded-full hover:bg-gray-100 transition-all w-[32px] h-[32px] flex justify-center items-center'>
						<BsPencilFill size='18' />
					</div>
				</div>
			</div>
			<div className='h-[2px] w-auto m-[-10px] my-[5px] bg-gray-900'>&nbsp;</div>
			<div className='w-full h-full text-1xl'>{props.content}</div>

			<div
				className={`text-3xl absolute w-full h-full top-0 left-0 text-center flex justify-center items-center text-black transition-all ${
					props.loading ? 'white-glass' : ''
				} pointer-events-none`}
			>
				{props.loading ? 'Loading...' : ''}
			</div>
		</div>
	);
};

const Textarea = (props: any) => {
	return (
		<textarea
			placeholder={props.placeholder}
			className={clsx('placeholder-gray-500 bg-white outline-none border-none rounded w-full p-2', props.className || '')}
			value={props.value}
			onChange={props.onChange}
		></textarea>
	);
};
const Field = (props: any) => {
	return (
		<input
			type='text'
			placeholder={props.placeholder}
			className={clsx('placeholder-gray-500 bg-white outline-none border-none rounded w-full p-2', props.className || '')}
			onChange={props.onChange}
			value={props.value}
		></input>
	);
};

const Button = (props: any) => {
	return (
		<button onClick={props.onClick} className={clsx('rounded bg-gray-800 w-full p-2 text-white', props.className || '')}>
			{props.label}
		</button>
	);
};

const Overlay = (props: any) => {
	const [state, setState] = useState({
		title: props.title || '',
		content: props.content || '',
	});

	return (
		<div className='w-full h-full fixed top-0 left-0 white-glass flex justify-center items-center z-20 transition-all'>
			<div className='w-[450px] h-min max-h-[1000px] rounded bg-gray-300 flex flex-col p-2 box-border justify-center text-3xl'>
				<div className='w-full text-center py-2 text-5xl mb-2'>{props.header}</div>
				<div className='p-2 w-full'>
					<Field
						placeholder='Title'
						className='mb-2 text-2xl'
						onChange={(event: any) => {
							setState({
								...state,
								title: event.target.value,
							});
						}}
						value={state.title}
					/>
					<Textarea
						placeholder='Content'
						className='mb-2 text-2xl max-h-[1000px]'
						onChange={(event: any) => {
							setState({
								...state,
								content: event.target.value,
							});
						}}
						value={state.content}
					/>
					<Button
						label={props.loading ? 'Loading...' : 'Submit'}
						className='mb-2'
						onClick={() => {
							// if (state.title + state.content == '') return;
							// console.log(state.title);
							// console.log(state.content);
							props.onSubmit({ title: state.title, content: state.content });
						}}
					></Button>
					<Button
						label='Cancel'
						onClick={() => {
							// if (state.title + state.content == '') return;
							// console.log(state.title);
							// console.log(state.content);
							props.onCancel();
						}}
					></Button>
				</div>
			</div>
		</div>
	);
};

const GET_NOTES = gql`
	query GetNotes($authKey: String) {
		notes(authKey: $authKey) {
			notes {
				_id
				content
				title
			}
		}
	}
`;

const ADD_NOTE = gql`
	mutation AddNote($authKey: String!, $title: String!, $content: String!) {
		addNote(authKey: $authKey, title: $title, content: $content) {
			_id
			content
			title
		}
	}
`;

const DELETE_NOTE = gql`
	mutation DeleteNote($authKey: String!, $id: String!) {
		deleteNote(authKey: $authKey, id: $id)
	}
`;

const EDIT_NOTE = gql`
	mutation EditNote($authKey: String!, $id: String!, $title: String!, $content: String!) {
		editNote(authKey: $authKey, id: $id, title: $title, content: $content) {
			_id
			title
			content
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

const SIGN_OUT = gql`
	mutation SignOut($authKey: String) {
		signout(authKey: $authKey)
	}
`;

const getAuth = () => {
	let authKey = localStorage.getItem('authKey') || '';
	return authKey;
};

export default function Dashboard() {
	const router = useRouter();

	const [state, setState] = useState({
		overlay: {
			status: false,
			type: '',
		},
		user: null,
		notes: [],
		active: '',
	});

	const [getNotes, { loading, error, data }] = useLazyQuery(GET_NOTES, {
		onCompleted: (data) => {
			setState({
				...state,
				notes: data == null || data == undefined ? [] : data.notes.notes,
			});
		},
		onError: (error) => {
			console.log(error);
		},
	});

	const [authenticate, authData] = useLazyQuery(AUTHENTICATE, {
		onCompleted: (data) => {
			console.log(data);
			if (data.authenticate != null) {
				console.log(data.authenticate.email);
				setState({
					...state,
					user: data.authenticate.email,
				});

				return;
			}

			router.push('/login');
		},
		onError: (error) => {
			console.log(error);
			router.push('/login');
		},
	});

	const [signOut, signOutData] = useMutation(SIGN_OUT, {
		onCompleted: (_data) => {
			localStorage.setItem('authKey', '');

			router.push('/');
		},
	});

	const [createNote, createData] = useMutation(ADD_NOTE, {
		onCompleted: (_data) => {
			let note: any = [_data.addNote];
			setState({
				...state,
				notes: state.notes.concat(note),
				overlay: {
					status: false,
					type: '',
				},
				active: '',
			});
		},
		onError: (error) => {
			console.error(error.toString());
		},
	});

	const [removeNote, removeData] = useMutation(DELETE_NOTE, {
		onCompleted: (_data) => {
			let deleteId = _data.deleteNote;

			let notes = [...state.notes];
			let index = notes.findIndex((item: any) => item._id == deleteId);
			if (index == -1) return;

			notes.splice(index, 1);

			setState({
				...state,
				active: '',
				notes: notes,
			});
		},
		onError: (error) => {
			console.error(error.toString());
		},
	});
	const [editNote, editData] = useMutation(EDIT_NOTE, {
		onCompleted: (_data) => {
			let editId = _data.editNote._id;

			let notes: any = [...state.notes];
			let index = notes.findIndex((item: any) => item._id == editId);
			if (index == -1) return;

			notes[index] = _data.editNote;

			setState({
				...state,
				overlay: {
					status: false,
					type: '',
				},
				active: '',
				notes: notes,
			});
		},
		onError: (error) => {
			console.error(error.toString());
		},
	});

	useEffect(() => {
		authenticate({
			variables: {
				authKey: getAuth(),
			},
		});
	}, []);

	useEffect(() => {
		if (state.user == null) return;
		getNotes({
			variables: {
				authKey: getAuth(),
			},
		});
	}, [state.user]);

	const onSubmitCreate = (result: any) => {
		let { title, content } = result;
		let auth = getAuth();

		createNote({
			variables: {
				authKey: auth,
				title: title,
				content: content,
			},
		});
	};
	const onSubmitEdit = (result: any) => {
		let { title, content } = result;

		editNote({
			variables: {
				authKey: getAuth(),
				id: state.active,
				title: title,
				content: content,
			},
		});
	};

	// data.notes
	// const getOverlay = () => {
	// 	let Overlay = overlays[state.overlay.type];

	// 	return <Overlay onSubmit={overlayHandlers[state.overlay.type]} loading={loadings[state.overlay.type]} />;
	// };

	// let notes = [{ title: 'Hello', content: 'There' }];

	const overlayTitles: any = {
		'create': 'Create Note',
		'edit': 'Edit Note',
	};

	const getOverlay = () => {
		let active: any = { title: '', content: '' };
		if (state.overlay.type == 'edit') {
			let result = state.notes.find((note: any) => note._id == state.active);
			active = result || active;
		}

		console.log(active);

		return (
			<Overlay
				header={overlayTitles[state.overlay.type]}
				title={active.title}
				content={active.content}
				loading={createData.loading || editData.loading}
				onSubmit={(result: any) => {
					switch (state.overlay.type) {
						case 'create':
							onSubmitCreate(result);
							break;
						case 'edit':
							onSubmitEdit(result);
							break;
					}
				}}
				onCancel={() => {
					setState({
						...state,
						overlay: {
							status: false,
							type: '',
						},
						active: '',
					});
				}}
			/>
		);
	};

	return (
		<div className='w-full h-full relative'>
			<div className='text-white fixed top-0 right-0  mr-[50px] max-w-[600px] h-min truncated text-left mt-3 z-30 text-3xl flex flex-row justify-center items-center'>
				<IoMdExit
					className='h-full p-2 hover:bg-red-700 transition-all rounded-full mr-2'
					size={48}
					onClick={() => {
						signOut({
							variables: {
								authKey: getAuth(),
							},
						});
					}}
				/>
				<div className='mb-[5px]'>{signOutData.loading ? 'Loading...' : `Logged in as: ${state.user || ''}`}</div>
			</div>

			<div
				className={`w-full absolute h-full flex justify-center items-center text-[50px] z-10 text-${
					error ? 'red-400' : 'white'
				} pb-[50px] transition-all duration-700 pointer-events-none text-center ${loading || authData.loading || error ? 'black-glass' : ''}`}
			>
				{error ? error.toString() : loading || authData.loading ? 'Loading...' : ''}
			</div>

			{state.overlay.status ? getOverlay() : ''}

			<div className='w-full flex justify-center flex-col'>
				<div className='w-full h-min border-y-2 border-gray-600 mt-[10px] py-2 pl-2'>
					<button
						className='border-none outline-none w-[48px] h-[48px] text-7xl bg-gray-300 rounded flex justify-center items-center group hover:bg-gray-200 transition-all'
						onClick={() => {
							setState({
								...state,
								overlay: {
									status: true,
									type: 'create',
								},
								active: '',
							});
						}}
					>
						<svg width='32' height='32'>
							<line x1='16' y1='0' x2='16' y2='32' stroke='black' strokeWidth='4' className='group-hover:stroke-gray-500' />
							<line x1='0' y1='16' x2='32' y2='16' stroke='black' strokeWidth='4' className='group-hover:stroke-gray-500' />
						</svg>
					</button>
				</div>

				<div className='w-full h-min p-3 flex flex-wrap gap-4 justify-start'>
					{state.notes.map((note: any, index: any) => {
						return (
							<Note
								key={`note-${index}`}
								title={note.title}
								content={note.content}
								loading={state.active == note._id && removeData.loading}
								index={index}
								onRemove={() => {
									console.log(`Removing ${note._id}`);
									setState({
										...state,
										active: note._id,
									});

									removeNote({
										variables: {
											authKey: getAuth(),
											id: note._id,
										},
									});
								}}
								onEdit={() => {
									setState({
										...state,
										overlay: {
											status: true,
											type: 'edit',
										},
										active: note._id,
									});
								}}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
