import { collection, onSnapshot } from 'firebase/firestore';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Movie } from '../typings';

type ListItem = (Movie | DocumentData) & {
	addedAt?: Timestamp | null;
};

function useList(uid: string | undefined) {
	const [list, setList] = useState<ListItem[]>([]);

	useEffect(() => {
		if (!uid) return;

		return onSnapshot(collection(db, 'customers', uid, 'myList'), (snapshot) => {
			const movies = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as ListItem[];

			movies.sort((a, b) => (b.addedAt?.toMillis() ?? 0) - (a.addedAt?.toMillis() ?? 0));
			setList(movies);
		});
	}, [uid]);

	return list;
}

export default useList;
