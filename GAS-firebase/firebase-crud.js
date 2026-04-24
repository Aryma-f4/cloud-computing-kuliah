/**
 * Firestore CRUD operations for E-Absen Firebase version
 * This replaces the spreadsheet operations with Firestore
 */

/**
 * Get document from Firestore
 */
function getFirestoreDocument(collection, documentId) {
  try {
    const endpoint = `${collection}/${documentId}`;
    const response = firebaseRequest(endpoint);
    
    if (response.error) {
      if (response.error.includes('404')) {
        return null; // Document not found
      }
      throw new Error(response.error);
    }
    
    return firestoreDocToObject(response);
  } catch (error) {
    console.error('Error getting Firestore document:', error);
    return null;
  }
}

/**
 * Create or update document in Firestore
 */
function setFirestoreDocument(collection, documentId, data) {
  try {
    const endpoint = `${collection}/${documentId}`;
    const firestoreData = objectToFirestoreDoc(data);
    
    const response = firebaseRequest(endpoint, {
      method: 'PATCH',
      payload: firestoreData
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting Firestore document:', error);
    return false;
  }
}

/**
 * Delete document from Firestore
 */
function deleteFirestoreDocument(collection, documentId) {
  try {
    const endpoint = `${collection}/${documentId}`;
    const response = firebaseRequest(endpoint, {
      method: 'DELETE'
    });
    
    if (response.error && !response.error.includes('404')) {
      throw new Error(response.error);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting Firestore document:', error);
    return false;
  }
}

/**
 * Query documents from Firestore
 */
function queryFirestoreDocuments(collection, field, operator, value, limit = 100) {
  try {
    // Build structured query
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: operator,
            value: getFirestoreValue(value)
          }
        },
        limit: limit
      }
    };
    
    const endpoint = `${collection}:runQuery`;
    const response = firebaseRequest(endpoint, {
      method: 'POST',
      payload: query
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Parse query results
    const results = [];
    if (response && response.length > 0) {
      for (const doc of response) {
        if (doc.document) {
          const data = firestoreDocToObject(doc.document);
          if (data) {
            results.push(data);
          }
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error querying Firestore documents:', error);
    return [];
  }
}

/**
 * Get Firestore value for query
 */
function getFirestoreValue(value) {
  if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    } else {
      return { doubleValue: value };
    }
  } else if (typeof value === 'boolean') {
    return { booleanValue: value };
  } else if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  } else if (value === null || value === undefined) {
    return { nullValue: null };
  }
  return { stringValue: String(value) };
}

/**
 * Add document to Firestore collection (auto-generated ID)
 */
function addFirestoreDocument(collection, data) {
  try {
    const endpoint = collection;
    const firestoreData = objectToFirestoreDoc(data);
    
    const response = firebaseRequest(endpoint, {
      method: 'POST',
      payload: firestoreData
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Extract document ID from response
    if (response.name) {
      const parts = response.name.split('/');
      return parts[parts.length - 1];
    }
    
    return null;
  } catch (error) {
    console.error('Error adding Firestore document:', error);
    return null;
  }
}

/**
 * Get all documents from a collection
 */
function getAllFirestoreDocuments(collection, limit = 1000) {
  try {
    const endpoint = collection;
    const response = firebaseRequest(endpoint + '?pageSize=' + limit);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const results = [];
    if (response.documents) {
      for (const doc of response.documents) {
        const data = firestoreDocToObject(doc);
        if (data) {
          results.push(data);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error getting all Firestore documents:', error);
    return [];
  }
}