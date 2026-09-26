/** Random names for the Realm's people, so each death in the log is someone. Purely cosmetic. */

const FIRST_NAMES = [
  'Alda', 'Aldric', 'Anselm', 'Agnes', 'Bertram', 'Brenna', 'Cedric', 'Cora', 'Dunstan', 'Edda',
  'Edmund', 'Elsbeth', 'Emmet', 'Finn', 'Freya', 'Garrick', 'Gisela', 'Godric', 'Greta', 'Hilda',
  'Hugo', 'Ida', 'Ingrid', 'Isolde', 'Jarvis', 'Jocelyn', 'Kenric', 'Lena', 'Leofric', 'Mabel',
  'Maud', 'Merrick', 'Nell', 'Osric', 'Otto', 'Petra', 'Quentin', 'Rowena', 'Rolf', 'Sabine',
  'Sigrid', 'Tamsin', 'Tobias', 'Ulric', 'Una', 'Wendel', 'Wilma', 'Wynn', 'Yvette', 'Ziska',
];

const FAMILY_NAMES = [
  'Ashford', 'Barrow', 'Bramble', 'Brook', 'Cobb', 'Crane', 'Dale', 'Fenwick', 'Flint', 'Gale',
  'Hale', 'Hearth', 'Holt', 'Kettle', 'Lark', 'Marsh', 'Millward', 'Moss', 'Oakes', 'Pike',
  'Quarrel', 'Reed', 'Rook', 'Rowe', 'Stone', 'Thatcher', 'Thorne', 'Wick', 'Woodward', 'Wren',
];

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;

export function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(FAMILY_NAMES)}`;
}
