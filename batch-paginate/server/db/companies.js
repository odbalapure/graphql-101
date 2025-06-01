import DataLoader from 'dataloader';
import { connection } from './connection.js';

const getCompanyTable = () => connection.table('company');

export async function getCompany(id) {
  return await getCompanyTable().first().where({ id });
}

// export const companyLoader = new DataLoader(async (ids) => {
//   console.log('[companyLoader] ids:', ids);
//   const companies = await getCompanyTable().select().whereIn('id', ids);
//   return ids.map((id) => companies.find((company) => company.id === id));
// });

// NOTE: This function might look but this a Factory function (creates a new instance every time)
// Whereas the above exports a single shared DataLoader instance i.e. a Singleton instance
export const createCompanyLoader = () => {
  return new DataLoader(async (ids) => {
    console.log('[companyLoader] ids:', ids);
    const companies = await getCompanyTable().select().whereIn('id', ids);
    return ids.map((id) => companies.find((company) => company.id === id));
  })
};
