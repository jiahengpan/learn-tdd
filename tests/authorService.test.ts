import { Request, Response } from 'express';
import express from 'express';
import Author from '../models/author';

jest.mock('../models/author');
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

describe('Author Service', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let routeHandler: Function;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    req = {};
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    jest.isolateModules(() => {
      require('../pages/authors');
    });
    
    routeHandler = (express.Router() as any).get.mock.calls[0][1];
  });
  
  test('should return a list of authors sorted by family name', async () => {
    // Mock data
    const mockAuthors = [
      'Doe, John : 1990 - 2020',
      'Smith, Jane : 1985 - '
    ];
    
    (Author.getAllAuthors as jest.Mock).mockResolvedValueOnce(mockAuthors);
    
    await routeHandler(req, res);
    
    expect(Author.getAllAuthors).toHaveBeenCalledWith({ family_name: 1 });
    expect(res.send).toHaveBeenCalledWith(mockAuthors);
  });
  
  test('should return "No authors found" message when no authors exist', async () => {
    // Mock empty data
    const mockAuthors: string[] = [];
    
    // Setup mock implementation
    (Author.getAllAuthors as jest.Mock).mockResolvedValueOnce(mockAuthors);
    
    await routeHandler(req, res);
    
    expect(Author.getAllAuthors).toHaveBeenCalledWith({ family_name: 1 });
    expect(res.send).toHaveBeenCalledWith('No authors found');
  });
  
  test('should return "No authors found" message when an error occurs', async () => {
    // Setup mock implementation to throw an error
    (Author.getAllAuthors as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    await routeHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(Author.getAllAuthors).toHaveBeenCalledWith({ family_name: 1 });
    expect(console.error).toHaveBeenCalledWith('Error processing request:', expect.any(Error));
    expect(res.send).toHaveBeenCalledWith('No authors found');
    
    console.error = originalConsoleError;
  });
});